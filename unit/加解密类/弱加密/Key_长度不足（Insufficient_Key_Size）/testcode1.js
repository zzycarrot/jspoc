crmfObject = crypto.generateCRMFRequest(
        "CN=" + name.value,
        password.value,
        authenticator,
    keyTransportCert,
        "setCRMFRequest();",
        512, null, "rsa-dual-use");
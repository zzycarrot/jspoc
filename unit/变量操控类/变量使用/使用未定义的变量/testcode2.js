function initConfig(userRole) {
    if (userRole === "admin") {
      var config = { accessLevel: "full" }; 
    }
    
    console.log("Loaded config:", config); 
    
    try {
      return config.accessLevel; 
    } catch (e) {
      console.error("Config error:", e); 
    }
  }
  
  initConfig("guest");
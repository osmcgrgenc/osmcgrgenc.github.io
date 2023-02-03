var WebEmarsysSdk = WebEmarsysSdk || []
      WebEmarsysSdk.push(['init', {
        applicationCode: 'EMS72-8E1CA',
        safariWebsitePushID: 'web.com.avansas',
        defaultNotificationTitle: 'Avansas',
        defaultNotificationIcon: 'https://tracking.avansas.com/custloads/290455295/md_1818699.png',
        autoSubscribe: false,
        serviceWorker: {
          url: '_ui/shared/js/service-worker.js',
          applicationServerPublicKey: 'BC1HrFWbMTndu6-5cHiw6dM8XSsXtyQ7cCqIFpj-gaywpvo90iaQc6AshGxxIRMHu4d-jkFaX9kSXoN69_4N3eg'
        }
      }])

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/_ui/shared/js/service-worker.js');
      }

    var initCounter = 0;
    var sdkInitController = setInterval(function(){
    initCounter++;
    if(initCounter>100){
        clearInterval(sdkInitController);
    }
        if(WebEmarsysSdk.ready){
         clearInterval(sdkInitController);
                  WebEmarsysSdk.init({

                applicationCode: 'EMS72-8E1CA',
                safariWebsitePushID: 'web.com.avansas',
                defaultNotificationTitle: 'Avansas',
                defaultNotificationIcon: 'https://tracking.avansas.com/custloads/290455295/md_1818699.png',
                autoSubscribe: false,
                serviceWorker: {
                  url: '_ui/shared/js/service-worker.js',
                  applicationServerPublicKey: 'BC1HrFWbMTndu6-5cHiw6dM8XSsXtyQ7cCqIFpj-gaywpvo90iaQc6AshGxxIRMHu4d-jkFaX9kSXoN69_4N3eg'
                }, enableLogging:false
              }).then(function(){
                WebEmarsysSdk.subscribe().then(function(){
                  var loginUser = JSON.parse(localStorage.getItem("_wp_ci_2"));
                  if(loginUser){
                  WebEmarsysSdk.login({
                  fieldId:"44274", fieldValue:loginUser.value
                  })
                  }
                });
              });
        }
    },100)

var url = require('url'),
    qs = require('querystring');

module.exports = function (ringBuffer, app) {
    
    app.use("/sys/logs/clear", function (req, res, next) {
        
        var u = url.parse(req.url).path;
        var q = qs.parse(u.split("?").length > 1 ? u.split("?")[1] : "");
            
        var fk = [];
        if (q && (fk = Object.keys(q)).length) {
            
            for (var j=0; j<ringBuffer.records.length; ) {
                    
                var record = ringBuffer.records[j];
                var matches = true;
            
                for (var i=0; i<fk.length; i++){
                    
                    if (record[fk[i]] != q[fk[i]])
                        matches = false;
                        
                    if (!matches)
                       break;
                }
                
                if (matches){
                    
                    ringBuffer.records.splice(j, 1);
                } else
                    j++;
            }
        } else
            ringBuffer.records = [];
        
        res.json(true);
    });
    
    app.use("/sys/logs/raw", function (req, res, next) {
            
        return res.json(ringBuffer.records);
    });
    
    app.use("/sys/logs", function (req, res, next) {
            
        var u = url.parse(req.url).path;
        var q = qs.parse(u.split("?").length > 1 ? u.split("?")[1] : "");
        
        //console.log(q)
        
        if (q && Object.keys(q).length) {
            ringBuffer.filter(q);
        } else
            ringBuffer.filter({});
        
        return res.render("/ui/templates/logs.htm", {logs: ringBuffer.records});
    });
};
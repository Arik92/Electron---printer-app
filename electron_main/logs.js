const { BrowserWindow } = require('electron');
const Bottleneck = require("bottleneck");
const axios = require('axios').default;
const moment = require('moment');
const { getMachineName } = require('./settings');
const { AUTH_HEADER, LOG_API, QUEUE_API, ARTWORK_API } = require('../config').config;

const factory_log_limiter = new Bottleneck({
    maxConcurrent: 3,
    minTime: 333
});

const machName = getMachineName();
// getLogs - Fully functional, not currently in use 
// module.exports.getLogs = function(startDate, endDate) {    

//     const logStart = startDate?    
//         startDate
//         : moment()
//             .startOf('month')
//             .utc()
//             .format('YYYY/MM/DD HH:mm:ss');

//     const logEnd = endDate?        
//         endDate
//         : moment()
//             .startOf('day')
//             .utc()
//             .format('YYYY/MM/DD HH:mm:ss');

//     const logQuery = {
//         "start": logStart,
//         "end": logEnd
//     };
//     const logRequestOptions = {
//         url: LOG_API,
//         method: 'POST',
//         headers: {
//           'Authorization': AUTH_HEADER,
//           'Content-Length': Buffer.byteLength(JSON.stringify(logQuery))
//         }
//     };
//     try {
//         axios.post(LOG_API, logQuery, logRequestOptions).then(response => {                  
//         }, axiosErr => {
//             console.log('axios get logs Error? ', axiosErr);
//         });        
//     }
//     catch(getErr) {
//         console.log('error getting logs from factory API', getErr);
//     }    
// }

module.exports.saveLog = async function(logMessage, logType) {
    
    const reqBody = {
        "Date": moment().format('YYYY/MM/DD HH:mm:ss'),
        "Message": logMessage,
        "Type": logType,
        "Machine": machName
    }

    const logPostOptions = {
        url: LOG_API,
        method: 'PUT',
        headers: {
          'Authorization': AUTH_HEADER,
          'Content-Length': Buffer.byteLength(JSON.stringify(reqBody))
        }
    };

    try {
        const logRes = await factory_log_limiter.schedule(() => axios.put(logPostOptions.url, reqBody, logPostOptions));      
        
            if (logRes.data.success) {
                const win = BrowserWindow.getAllWindows();
                if (win && win.length > 0) {
                    win[0].webContents.send('new-logs', response.data.item);
                }
            }            
    }
    catch(getErr) {
        console.log('error sending log to factory API', getErr);
    }    
}

module.exports.saveArtwork = async function(sku, size, type) {
    
    const reqBody = {
        "Date": moment().format('YYYY/MM/DD HH:mm:ss'),        
        "Type": type, // to be determined. saved? downloaded? panel type? layout? dpi? No idea
        "Size": size,
        "SKU": sku,
        "Machine": machName
    };

    const postOptions = {
        url: ARTWORK_API,
        method: 'PUT',
        headers: {
          'Authorization': AUTH_HEADER,
          'Content-Length': Buffer.byteLength(JSON.stringify(reqBody))
        }
    };

    try {
        await factory_log_limiter.schedule(() => axios.put(postOptions.url, reqBody, postOptions));          
    }
    catch(getErr) {
        console.log('error sending artwork to factory API', getErr);
    }    
}

module.exports.saveQueue = async function(orderId, itemId, printId,sku, size) {   
    
    const reqBody = {
        "Date": moment().format('YYYY/MM/DD HH:mm:ss'),        
        "OrderID": orderId,
        "ItemID": itemId,
        "PrintID": printId,
        "Size": size,
        "SKU": sku,
        "Machine": machName
    };

    const postOptions = {
        url: QUEUE_API,
        method: 'PUT',
        headers: {
          'Authorization': AUTH_HEADER,
          'Content-Length': Buffer.byteLength(JSON.stringify(reqBody))
        }
    };

    try {
        await factory_log_limiter.schedule(() => axios.put(postOptions.url, reqBody, postOptions));          
    }
    catch(getErr) {
        console.log('error sending queue item to factory API', getErr);
    }    
}

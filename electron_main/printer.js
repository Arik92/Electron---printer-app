const { net } = require('electron');
const http = require('http');
const https = require('https');
const moment = require('moment');
const Bottleneck = require("bottleneck");
const fs = require('fs');
const CronJob = require('cron').CronJob;

const { PRINTER_INTERVAL } = require('../config').config;
const { errorLog, directoryLog } = require('./consts');
const { getCustomDirectory } = require('./settings');
const { saveLog } = require('./logs');

let panelCronFlag = false;
let panelReuqestInProgress = false;
let panelFilesCron;

const getPanelFlag = () => {
    return panelCronFlag;
};
module.exports.getPanelFlag = getPanelFlag;

const panelCronStopCheck = (newFlag) => {
    panelCronFlag = newFlag;
    if (!newFlag && panelFilesCron) {
        saveLog('panel update cancelled', directoryLog)
        panelFilesCron.stop();
    } else if (newFlag) {
        saveLog('panel update initiated', directoryLog);
    }
    return panelCronFlag;    
};
module.exports.panelCronStopCheck = panelCronStopCheck;

const activatePrinterCron = () => {
    if (panelCronFlag) {
        console.log('cron job already in progress. resetting ');
        return false;
    } // this would never happen
    panelCronFlag = true;    
    const cronStr = '0' + ' *' + '/' + PRINTER_INTERVAL + ' * * * *';
    // const cronStr = '0 * * * * *'; // TESTING

    panelFilesCron = new CronJob(cronStr, () => {
        // tick
        if (!panelReuqestInProgress) {
            panelReuqestInProgress = true;
            saveLog('Open orders started', directoryLog);    
            getPrinterData();   
        } else {
            saveLog('Download already in progress', directoryLog);
        }
        }, () => {
            // panelReuqestInProgress = false;            
        }, true);
        return true;
};
module.exports.activatePrinterCron = activatePrinterCron;

function findInFs(panels) {  // for each one of these panels, find out if he is there
    const res = [];
    panels.forEach(async panel => {
        const replacedPanelSize = panel.panelData.panel.replace(/\"/g, '').replace(/\s/g, '');     
        const fileName = '/' + panel.itemSku + '-' + replacedPanelSize + '-' + panel.itemPart + '.jpg';
        const sizeDir = panel.itemDir + '/' + panel.itemSize;
        const lutAddr = sizeDir + '/' + 'last_update_time.txt';

        if (!fs.existsSync(sizeDir + fileName)) {
            res.push(panel);
        }
         else {    // check if needs update
            fs.readFile(lutAddr,'utf8', (err, data) => {
               if (err) {
                   if (err.code === 'ENOENT') { // file exists but no LUT file, so it needs to be updated
                       res.push(panel);
                   } else {
                    // console.log('error is ', err);
                    saveLog('error reading last_update_time file '+ lutAddr+' : '+ err, errorLog);                   
                   }
               }   else {            
                   const dirLut = moment(data, 'MMM Do, h:mm:ss a');//read the file
                   const panelLut = moment(panel.last_update_date);
            //     console.log('comparing panel date '+panelLut.format()+' and dir date '+ dirLut.format());
                   if (panelLut.isAfter(dirLut)) {
                    res.push(panel);
                   }
               }
            })            
        }
    });        
    return res;
}

async function makePanelArray(items) {
    const panelArray = [];
    const mongoCustomDir = await getCustomDirectory();
    const customDir = mongoCustomDir.value;
    if (!fs.existsSync(customDir)) {
        saveLog('Directory ' + customDir + ' did not exist. made it! ', directoryLog);
        fs.mkdirSync(customDir);
    } 
    items.map(item => {
        const replacedSize = item.size.replace(/\"/g, '').replace(/\s/g, '');
        const dir = customDir ? customDir + '/' + item.sku : defaultDirectory + '/' + item.sku;
        item.printData.panels.map((panel, index) => {
            let panelObj = {
                itemPart: (index + 1) + '_' + item.printData.panels.length,
                itemSku: item.sku,
                itemDir: dir,
                itemSize: replacedSize,
                panelData: panel,
                last_update_date: item.printData.last_update_date    
            };
            panelArray.push(panelObj);
        })        
    })
    return panelArray;
}

async function storePanelFiles(items) {
    
    const cloudinary_limiter = new Bottleneck(
        {
            maxConcurrent: 3,
            minTime: 333
        });

    const itemsWithPanels = await makePanelArray(items);         
    const itemsToBeAdded = findInFs(itemsWithPanels);     // determine who is in fs already 

    /**
     * Somehere here - make a request for sku/size pair panels.
     * Possibly remake makePanelArray. If that's the case it is imperative that I first check which items are in filesystem
     */
    // saveLog('out of ' + panelArray.length + ' possible panels ' + (panelArray.length - itemsToBeAdded.length) + ' are already in the filesystem', 'Directory');
    // saveLog('Making requests for the remaining ' + itemsToBeAdded.length + ' panels', 'Directory');
    console.log('items with prints? ', itemsToBeAdded.length);
    saveLog('Open orders - ' + itemsToBeAdded.length + ' prints ', directoryLog);
    console.log('after saveLog? ');
    // saveLog(itemsToBeAdded.length + ' need download', directoryLog);
    const arrayLength = itemsToBeAdded.length;    

    itemsToBeAdded.map((panel, index) => {        
        console.log('making request for ', panel);
        saveLog('Making image request for ' + panel.panelData.url, directoryLog);

        cloudinary_limiter.submit(http.get, panel.panelData.url, (response) => {            
            if (!fs.existsSync(panel.itemDir)){
                fs.mkdirSync(panel.itemDir);
            } // make new panels folder if doesnt exist yet
            const sizeDir = panel.itemDir+ '/' + panel.itemSize;
            if (!fs.existsSync(sizeDir)) {
                fs.mkdirSync(sizeDir);
            } // make new panels size folder inside item directory if doesnt exist yet
            // download image and save it    
            response.setEncoding('binary');
            let imageFile = '';        
            response.on('data', (chunk) => {
              imageFile+= chunk;            
            });                                  
            response.on('end', () => {
                if (imageFile==='') {
                    saveLog('item for which image file is EMPTY: '+ panel.itemSku, errorLog);
                    panelReuqestInProgress = false;
                } else {
              const replacedPanelSize = panel.panelData.panel.replace(/\"/g, '').replace(/\s/g, '');   //  Doesnt have to be here. Yeah but it might stay here anyway
              const fileName = '/' + panel.itemSku + '-' + replacedPanelSize + '-' + panel.itemPart + '.jpg'; // Possibly add some sort of timestamp
              fs.writeFile(sizeDir + fileName, imageFile , 'binary', (writeErr) => {
                  if (writeErr) {
                      saveLog('file write error '+writeErr, errorLog);
                      throw writeErr;                                                                                              
                  }
                  saveLog(sizeDir + fileName +' downloaded successfully', directoryLog);
                  fs.readdir(sizeDir, (err, files) => {
                      if (err) {
                          saveLog('error reading from directory ' + err, errorLog);
                      }
                    // saveLog('there are currently ' + files.length + ' files successfully written in this directory', 'Directory');
                    // write/update LUT file
                    if (files.length === parseInt(panel.itemPart.split('_')[1])) {
                        fs.writeFile(sizeDir + '/' + 'last_update_time.txt', moment().format('MMM Do, h:mm:ss a'), lutErr => {
                            if (lutErr) {
                                console.log('error writing ');
                                saveLog('Last update time error ' + lutErr, 'error');
                            }
                            saveLog('successfully downloaded all files for and saved config file for ' + sizeDir , directoryLog);
                        })
                    }               
                });                  
              });            
            }
            if (index === arrayLength - 1) {
                saveLog('Open orders ended', directoryLog);
                panelReuqestInProgress = false;
            }
            });
        });
    })       
}

const existsOnCurrentCollection = (checkingItem, itemList) => {
     const isFound = itemList.find(item => {         
         return (item.sku === checkingItem.sku && item.size === checkingItem.size);
     });
     return isFound;
}
module.exports.existsOnCurrentCollection = existsOnCurrentCollection;

 const getPrinterData = () => {    
    console.log('getting printer data');
    const printDataUrl = 'https://backoffice.doublero.com/orders/printer'; // OLD URL - also had panel/print pairs
    // const printDataUrl = 'https://backoffice.doublero.com/orders/queue';
    const printDataOptions = {
        url: printDataUrl,
        method: 'GET',
        headers: {
            Authorization: 'ObpirxoNy9aosxTZxXEx'
        }
    };
    try {
    const req = net.request(printDataOptions);
    req.on('error', err => {
        saveLog('error while making printer request: ' + err, errorLog);
        // dialog.showOpenDialog(win, {title: 'Error while connecting'}) // file selection. might be useful
        // dialog.showMessageBox(win, {title: 'Error', message:'An error occured while requesting printer data. Could not connect'});
        saveLog('An error occured while requesting printer data. Could not connect', errorLog);
        panelReuqestInProgress = false;
    });

    req.on('response', response => {
        console.log('got printer data response');
        let unparsedBody = '';        
        response.on('data', (chunk) => {
            unparsedBody+= chunk;            
          });
          response.on('end', () => {
              console.log('request end start');
              const totalItems = [];
              const filteredItemList = [];
              const fetchedParsedOrders = JSON.parse(unparsedBody);
              console.log('got %d items ', fetchedParsedOrders.length);
              fetchedParsedOrders.map(order => {
                  order.items.map(orderItem => {
                    totalItems.push(orderItem);
                  })                  
              })              
              totalItems.map(totalItem => {
                if (!existsOnCurrentCollection(totalItem, filteredItemList)) {
                    filteredItemList.push(totalItem); // sorting order array into items and remove duplicates
                } 
              });
              console.log('got %d items in total ', filteredItemList.length);
            //   saveLog('Got ' + totalItems.length + ' items from orders. Out of which ' + filteredItemList.length + ' are unique' , 'Directory');
            // console.log('filtered item list ', filteredItemList);
            // const filteredItemsWithPanels = getItemPanels(filteredItemList);
            console.log('request end end ');
              storePanelFiles(filteredItemList).then(res => {
                  saveLog('Open orders ended', 'Directory'); 
                  panelCronFlag = false;
                //   win.webContents.send('panel-cron-update', panelCronFlag);                 
               });
          });
    });
    req.end();    
    }
    catch(itemError) {
        saveLog('Error getting printer data request' + itemError, errorLog);
        panelReuqestInProgress = false;
    }
} 
module.exports.getPrinterData = getPrinterData;
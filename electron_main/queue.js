const { net, dialog } = require('electron');
const axios = require('axios').default;
const Bottleneck = require("bottleneck");
const http = require('http');
const moment = require('moment');
const bwipjs = require('bwip-js');
const fs = require('fs');
const sharp = require('sharp');
const { existsOnCurrentCollection } = require('./printer');
const { getSetting } = require('./settings');
const { saveLog, saveArtwork, saveQueue } = require('./logs');
const { errorLog, directoryLog, appLog, printer_directory_setting, printer_queue_setting, artwork_save_log } = require('./consts');
const { PRINTER_INTERVAL, SHORT_ID_API } = require('../config').config;
const CronJob = require('cron').CronJob;


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
        saveLog('panel update cancelled', appLog);
        panelFilesCron.stop();
    } else if (newFlag) {
        saveLog('panel update initiated', appLog);
    }
    return panelCronFlag;    
};
module.exports.panelCronStopCheck = panelCronStopCheck;

const getBarcodeDefs = (dpi,height) => {
    let res = {
        height: 5,
        leftOffset:0,
        topOffset: Math.floor(height / 2) - 150
    };
    if (dpi==='300') {
        res.height = 10
        res.leftOffset = 5;        
    } 
    return res;
}

const generateBarcodeImageFromItem = (queueDirectory, printDirectory, shortId, orderId, item) => {
    // Save the barcode in the print itself in as [[order-id]]-[[item-id]]-[[panel-id]]-[[no-of-items]]
    const itemPanelsDir = printDirectory + '/' + item.sku + '/' + item.size.replace(/\"/g, '').replace(/\s/g, '');    

    if (!fs.existsSync(itemPanelsDir)) {
        // factory_log_limiter.schedule(() => saveLog('Directory ' + itemPanelsDir + ' did not exist yet. check', directoryLog));
        // saveLog('Directory ' + itemPanelsDir + ' did not exist yet. check', directoryLog);
        return; // for now
    } 
    if (!fs.existsSync(itemPanelsDir + '/config.txt')) {
        // saveLog('no config file: ' + itemPanelsDir + '/config.txt', directoryLog);
        console.log('no config file: ' + itemPanelsDir + '/config.txt', directoryLog);

        return; // for now
    } 

    const itemOrderDir = queueDirectory + '/' + orderId + '-' + item.id;
    if (!fs.existsSync(itemOrderDir)) {
        // saveLog('Directory ' + itemOrderDir + ' did not exist. made it! ', directoryLog);
        // console.log('Directory ' + itemOrderDir + ' did not exist. made it! ');
        // factory_log_limiter.schedule(() => saveLog('Directory ' + itemOrderDir + ' did not exist. made it! ', directoryLog));

        fs.mkdirSync(itemOrderDir);
    }     
    //  save in   /queue/[[order-id]]-[[item-id]]/[[order-id]]/[[item-id]]-[[panel-id]]-[[no-of-items]]
    
    console.log('attempting to read from ', itemPanelsDir + '/config.txt');
    fs.readFile(itemPanelsDir + '/config.txt', (configErr, configContent) => {
        if (configErr) {
            // saveLog('error reading config file for '+itemPanelsDir+'. ' + configErr, errorLog);
        } else {
            const dpi = JSON.parse(configContent).density;
            fs.readdir(itemPanelsDir, (panelFilesErr, panelFiles) => {
                if (panelFilesErr) {
                    console.log('panel files error ', panelFilesErr);
                } else if (panelFiles && panelFiles.length > 0) {
                panelFiles.forEach(async panelFile => {
                    console.log('does panel file have a jpg ', panelFile);
                    if (fs.existsSync(itemOrderDir + '/' + panelFile )) {                        
                        console.log('file %s already exists. return', itemOrderDir + '/' + panelFile );
                        return;
                    }
                    if (panelFile !== 'config.txt') {
                        console.log('not config: ', panelFile);
                        console.log('construct location %s', itemPanelsDir + '/'+ panelFile);                   
                        const imageDimensions = await sharp(itemPanelsDir + '/' + panelFile).metadata();
                        // console.log('imge defs are ', imageDimensions);
                    const barcodeDefs = getBarcodeDefs(dpi, imageDimensions.height);

                        // const barcodeText = orderId + item.id + panelFile; // + panel id??(I assume he meant name) 
                        const itemPartWithJpg = panelFile.split('-')[2].split('');
                        console.log('item part with jpg ', itemPartWithJpg);
                        
                        // itemPartWithJpg.join();
                        // console.log('part with jpg after being joined ', itemPartWithJpg);
                        // const barcodeSuffix = panelFile.split('-')[2].split('').splice(-1,4).join();
                        itemPartWithJpg.splice(-4, 4); // splicing .jpg
                        const barcodeSuffix = itemPartWithJpg.join('').replace('_', '-');

                        console.log('barcode suffix is ', barcodeSuffix);
                        const barcodeText = shortId + '-' + barcodeSuffix; // + panel id??(I assume he meant name) 
                        // barcodeText.splice
                        
                        bwipjs.toBuffer({
                            bcid:        'code128',       // Barcode type
                            text:        barcodeText,    // Text to encode
                            scale:       1,               // 3x scaling factor
                            height:      barcodeDefs.height,              // Bar height, in millimeters
                            width: 150,
                            includetext: true,            // Show human-readable text
                            textxalign:  'center',        // Always good to set this
                            rotate: 'R'
                        }, (err, png) => {
                            if (err) {
                                console.log('bwipjs error?', err);
                                // Decide how to handle the error. `err` may be a string or Error object
                            } else {                                            
                                let barcodeBuffer = png;
                                console.log('opening... ' + itemPanelsDir + '/' + panelFile);
                                sharp(itemPanelsDir + '/' + panelFile)  // 'C:/printer_app/AFT_172/36X15/AFT_172-6.25X7.5-1_5.jpg' , {density: 300}                                
                                .composite([{
                                    input: barcodeBuffer,
                                        top: barcodeDefs.topOffset,
                                        left: barcodeDefs.leftOffset
                                    }])  
                                .toBuffer()
                                .then(function(outputBuffer) {
                                    // const outputQueueName = shortId + panelFile.split('-')[2];
                                    fs.writeFile(itemOrderDir + '/' + panelFile + '.jpg', outputBuffer, err => {
                                        if (err) {
                                            console.log('error writing sharp image to file ', err);
                                        }
                                        saveQueue(orderId, item.id, shortId,item.sku, item.size.replace(/\"/g, '').replace(/\s/g, ''));
                                    })
                                }).catch(sharpErr => {
                                    console.log('sharp error: ', sharpErr);      
                                });            
                            }
                        });                                     
            }
                })
            }
            })   
        }
    })
   
}

const makeBarcodes = async(orders) => {
    const queueDir = await getSetting(printer_queue_setting);
    const queueDirVal = queueDir.value;
    const printDir = await getSetting(printer_directory_setting);
    const printDirVal = printDir.value;
    if (!fs.existsSync(queueDirVal)) {
        // factory_log_limiter.schedule(() => saveLog('Directory ' + queueDirVal + ' did not exist. made it! ', directoryLog));
        // saveLog('Directory ' + queueDirVal + ' did not exist. made it! ', directoryLog);
        fs.mkdirSync(queueDirVal);
    } 
    const factory_id_limiter = new Bottleneck({
        maxConcurrent: 3,
        minTime: 333
    });
    
    orders.forEach(order => {        
        order.items.forEach(async item => {
            const id_data = {
                "ItemID": item.id,
                "OrderID": order.orderID
            };
            const id_options = {
                // url: SHORT_ID_API,
                method: 'POST',                
                headers: {
                    'Authorization': 'ObpirxoNy9aosxTZxXEx'
                }
            };
            
            const shortIdResponse = await factory_id_limiter.schedule(() => axios.post(SHORT_ID_API, id_data, id_options));          
            if (shortIdResponse.data.success) {
            const shortIdVal = shortIdResponse.data.item.PrintID;
            console.log('making request');
            generateBarcodeImageFromItem(queueDirVal, printDirVal, shortIdVal, order.orderNumber, item);
            console.log('returned');
            }
        })
    })    
}
module.exports.makeBarcodes = makeBarcodes;

const getPanels = async (items) => {
    let res = [];
    const panel_limiter = new Bottleneck({
            maxConcurrent: 3,
            minTime: 333
        });
        
        const allPanels =  await panel_limiter.schedule(() => {
            const allTasks = items.map((item, index) => {
                const panelRequestUrl = 'https://backoffice.doublero.com/product_prints/print_by_sku_and_size/' + item.sku + '/' + item.size.replace(/"/g, '').replace(/\s/g, '');
                // console.log('requesting url ', panelRequestUrl);
                const panelRequestOptions = {
                url: panelRequestUrl,
                method: 'GET',
                headers: {
                    Authorization: 'ObpirxoNy9aosxTZxXEx'
                }
            };  
            return axios.get(panelRequestUrl, panelRequestOptions).then(response => {
                if (response.data) {
                    item.panels = response.data.panels;                
                    response.data.itemDir = item.sku + '/' + item.size.replace(/\"/g, '').replace(/\s/g, '');
                    return response.data;
                } else {
                    return {};
                }
            }, err => {
                return err;
            });
          });    
          // GOOD, we wait until all tasks are done.
          return Promise.all(allTasks);
        });
    res = allPanels.filter(panel => {
        return panel.panels;
    })
    return res;    
}

const removeDuplicateItems = (items) => {
    const res = [];    
    items.map(item => {
        if (!existsOnCurrentCollection(item, res)) {
            res.push(item);
        } 
      });        
    return res;
};

function findPanelsInFs(printDir, itemList) {  // for each one of these items, find out if he is in printer_directory
    const res = [];
    itemList.forEach(itemObj => {        
        const itemDir = printDir + '/' + itemObj.sku + '/' + itemObj.size.replace(/\"/g, '').replace(/\s/g, '');
        if (!itemObj.last_update_date || fs.existsSync(itemDir)) {
            return;
        } // if item didnt come with a last_update_date, then there isnt a print for it. no point in requesting       
          // if directory doesnt exist but a last update time does, it needs panels

         else {    // check if needs LUT update
            const configAddr = itemDir + '/' + 'config.txt';
            fs.readFile(configAddr,'utf8', (err, data) => {
               if (err) {
                   if (err.code === 'ENOENT') { // file exists but no LUT file, so it needs to be updated
                       res.push(itemObj);
                   } else {
                    // saveLog('error reading config file '+ lutAddr+' : '+ err, errorLog);                   
                   }
               }   else {            
                const jsonData = JSON.parse(data);
                   const dirLut = moment(jsonData.last_update_time, 'MMM Do, h:mm:ss a');//read the file
                   const itemLut = moment(itemObj.last_update_date);
                // console.log('comparing panel date ' + panelLut.format() + ' and dir date ' + dirLut.format());
                   if (itemLut.isAfter(dirLut)) {
                    res.push(itemObj);
                   }
               }
            })            
        }
    });        
    console.log('fs check returns %d files ', res.length);
    // saveLog('found ' + res.length + ' panels not already in directory', directoryLog);
    return res;
}

const savePanels = async(panelDir, panelList) => { // If panels for these items dont exist, request and save them
    const cloudinary_limiter = new Bottleneck(
        {
            maxConcurrent: 3,
            minTime: 333
        });
        let numDownloaded = 0;
        let numToBeDownloaded = 0;
        panelList.forEach(panelObj => {
            panelObj.panels.forEach(panel => {
                numToBeDownloaded++;
            });
        });
        console.log('starting save. the number of downloads needed is %d and there are %d prints to be downloaded ', numDownloaded, numToBeDownloaded);

        panelList.map(panelObj => {        
            let itemDirAddr = panelDir + '/'+ panelObj.itemDir.split('/')[0];
            if (!fs.existsSync(itemDirAddr)){
                fs.mkdirSync(itemDirAddr);
            } // make new panels folder if doesnt exist yet
            panelObj.panels.map((panel, index) => {
                const itemPart = index + 1 + '_'+ panelObj.panels.length;
                const fileName = '/' + panelObj.itemDir.replace('/','-') + '-' + itemPart + '.jpg'; // Possibly add some sort of timestamp
                // saveLog('Making image request for ' + fileName, directoryLog);
                cloudinary_limiter.submit(http.get, panel.url, (response) => {                            
                    const sizeDir = panelDir + '/' + panelObj.itemDir;
                    console.log('file directory is ', sizeDir);
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
                            // saveLog('item for which image file is EMPTY: '+ panel.itemSku, errorLog);
                            panelReuqestInProgress = false;
                        } else {
                      fs.writeFile(sizeDir + fileName, imageFile , 'binary', (writeErr) => {
                          if (writeErr) {
                            //   saveLog('file write error '+writeErr, errorLog);
                              throw writeErr;                                                                                              
                          }
                          //SAVEARTWORK
                          saveArtwork(panelObj.itemDir.split('/')[0], panelObj.itemDir.split('/')[1], artwork_save_log);
                          console.log(sizeDir + fileName +' downloaded successfully');
                          numDownloaded++;
                          console.log('downloaded %d panels so far', numDownloaded);
                        //   console.log('panel list index is %s and panlList', panelListIndex, panelList.length);
                            if (numDownloaded === numToBeDownloaded ) {
                                // saveLog('queue request ended', directoryLog);
                                panelReuqestInProgress = false;
                            }
                        //   saveLog(sizeDir + fileName +' downloaded successfully', directoryLog);
                          fs.readdir(sizeDir, (err, files) => {
                              if (err) {
                                //   saveLog('error reading from directory ' + err, errorLog);
                              }
                            // saveLog('there are currently ' + files.length + ' files successfully written in this directory', 'Directory');
                            // write/update LUT file
                            if (files.length === panelObj.panels.length) {
                                var dpiIndex = panel.url.indexOf("dn_");
                                var DPI = panel.url.substring(dpiIndex + 3, dpiIndex + 6);
                                const config_data = {
                                    last_update_time: moment().format('MMM Do, h:mm:ss a'),
                                    density: DPI
                                }
                                
                                fs.writeFile(sizeDir + '/' + 'config.txt',JSON.stringify(config_data) , lutErr => {
                                    if (lutErr) {
                                        console.log('error writing ');
                                        // saveLog('Last update time error ' + lutErr, 'error');
                                    }
                                    // saveLog('successfully downloaded all files for and saved config file for ' + sizeDir , directoryLog);
                                })
                            }               
                        });                  
                      });            
                    }                   
                    });
                });
         })              
    })    
}

const getQueueData = () => {    
    const queueDataUrl = 'https://backoffice.doublero.com/orders/queue';
    const queueDataOptions = {
        url: queueDataUrl,
        method: 'GET',
        headers: {
            Authorization: 'ObpirxoNy9aosxTZxXEx'
        }
    };
    try {
    const req = net.request(queueDataOptions);
    // saveLog('made queue data request ', directoryLog); // turn to saveLog
    req.on('error', err => {
        // saveLog('error while making queue request ', err);
        // dialog.showOpenDialog(win, {title: 'Error while connecting'}) // file selection. might be useful
        dialog.showMessageBox(win, {title: 'Error', message:'An error occured while requesting Queue data. Could not connect'});
        // saveLog('An error occured while requesting queue data. Could not connect', errorLog);
    });

    req.on('response', response => {
        let unparsedBody = '';        
        response.on('data', (chunk) => {
            unparsedBody+= chunk;            
          });
          response.on('end', async () => {     
            const printDir = await getSetting(printer_directory_setting);
            const customDir = printDir.value;       
            const fetchedParsedOrders = JSON.parse(unparsedBody);
            console.log('There are %d open orders', fetchedParsedOrders.length);
            const totalItems =[];
              fetchedParsedOrders.map(order => {
                order.items.map(orderItem => {
                  totalItems.push(orderItem);
                });                  
              });              

              const filteredItemList = removeDuplicateItems(totalItems); // removeDuplicates
              const filteredPanels = findPanelsInFs(customDir, filteredItemList); // find only the panels that need download
              const queueItems = await getPanels(filteredPanels);      // Get panel items for queue items not in directory
              if (queueItems.length > 0) {
                await savePanels(customDir, queueItems); // For each one of these panels, request and save it 
              } else {
                  panelReuqestInProgress
              }
            //   console.log('saved %d panels', numSaved);
              await makeBarcodes(fetchedParsedOrders);
              console.log('requests made available again...');
            //   panelReuqestInProgress = false;
            });         
        });
    req.end();    
    }
    catch {
        saveLog('Error getting printer data request', 'error');
    }
} 
module.exports.getQueueData = getQueueData;

const activateQueueCron = () => {
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
            saveLog('Open orders started ', directoryLog);    
            getQueueData();   
        } else {
            saveLog('Download already in progress', directoryLog);
        }
        }, () => {
            // panelReuqestInProgress = false;            
        }, true);
        return true;
};
module.exports.activateQueueCron = activateQueueCron;

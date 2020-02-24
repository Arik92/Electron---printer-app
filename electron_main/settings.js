const Setting = require('../models/settingModel').Setting;
const { printer_directory_setting, printer_queue_setting } = require('./consts');

const os = require('os');

const getMachineName = () => {
    return os.hostname();    
};
module.exports.getMachineName = getMachineName;
const machName = getMachineName();

 function getSetting(settingType) { 
    return Setting.findOne({
        $and: [
            {
                name: settingType
            },
            {
                machine_name: machName
            }
        ]   
    });
}
module.exports.getSetting = getSetting; // export but also use locally

module.exports.updateFileDirectory = async (directory_type, newPath) => {        
    return Setting.findOneAndUpdate({
        $and: [
            {
                name: directory_type
            },
            {
                machine_name: machName
            }
        ]   
    }, {$set: {value: newPath}}, (err,res) => {
        if (err) {
            console.log('error updating printer directory');
            throw err;
        } else {
            return res;
        }
    });
}

module.exports.createDefaultSettings = async () => {    // If no default settings exist, create them
    const dir = await getSetting(printer_directory_setting);
    if (dir) {
        return;
    }
    const defaultDirectoryPath = {
        name: printer_directory_setting,
        // value: `${__dirname}/Directory`
        value: 'C:/printer_app/directory',
        machine_name: machName
    }
    const defaultDirectory = new Setting(defaultDirectoryPath);
    await defaultDirectory.save();       

    const defaultQueuePath = {
        name: printer_queue_setting,
        value: 'C:/printer_app/queue',
        machine_name: machName
    }
    const defaultQueue = new Setting(defaultQueuePath);
    await defaultQueue.save();  
}

// module.exports.setPanelInterval = async (newTime) => {
//     const newTimeString = newTime.toString();
//     return Setting.findOneAndUpdate({name: 'panel_interval'}, {$set: {value: newTimeString}}, (err,res) => {
//         if (err) {
//             console.log('error updating panel interval', err);
//             throw err;
//         } else {
//             return res;
//         }
//     });
// }

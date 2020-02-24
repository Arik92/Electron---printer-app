const mongoose = require('mongoose');
// const mongoosePaginate = require('mongoose-paginate');

const SettingSchema = new mongoose.Schema({
    name: String, // setting (not unique anymore)
    value: String,
    machine_name: String
});

const Setting = mongoose.model('Setting', SettingSchema);
module.exports = {
    Setting
};

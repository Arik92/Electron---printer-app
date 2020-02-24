const mongoose = require('mongoose');
// const mongoosePaginate = require('mongoose-paginate');

const LogSchema = new mongoose.Schema({
    date: String,
    type: String,
    message: String,
    utc_date: String,
    created_at: Number, // date in milliseconds
    machine_name: String
});

// ProductSchema.plugin(mongoosePaginate); might need paginate for this

const Log = mongoose.model('Log', LogSchema);
module.exports = {
    Log
};

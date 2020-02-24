const mongoose = require('mongoose');
// const mongoosePaginate = require('mongoose-paginate');

const ItemSchema = new mongoose.Schema({
    name: String,
    sku: String,
    size: String,
    layout: String,
    prints: {
        last_update_time: Date, // check this
        bleed_depth: String,
        panels: [{
            fileUrl: String,
            cloudinaryUrl: String,
            size: String
            }
        ]
    }
//     - --- item id
// - --- item name
// - --- sku
// - --- size (i.e 35x45)
// - --- layout
// - --- prints {} (Object, not an array)
// - ---- last update time
// - ---- bleed_depth (i.e 1.5")
// - ---- panels []
// - ----- file (url to clodinary image)
// - ----- size (24"X36")

    // shopify_id: Number,
    // product_type: String,
    // layouts: [String],
    // layout_groups: [String]
});

// ProductSchema.plugin(mongoosePaginate);

const Item = mongoose.model('Item', ItemSchema);
module.exports = {
    Item
};

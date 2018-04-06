const mongoose = require('mongoose');

/**
 * Mongoose schema describing MongoDB deputy collection 
 */
const Deputy = mongoose.model('Deputy',{
    siteId: {
        type: Number,
        required: true
    },
    matricula: {
        type: Number,
        required: true
    },
    authorId: {
        type: Number,
        required: true
    },
    fullName: String,        
    party: String,            
    birthday: {
        type: String,
        match: /\d+-\d+/,        
    },
    state: String,            
    main: Boolean,            
    imgUrl: String,
    contactInformation: {        
        address: String,
        email: String,
        phone: {
            type: String,                         
        },
        fax: String        
    },
    commissions:[{
        acronym:String,
        description: String,
        main:Boolean
    }],
    votesIn2018: [{
        date:String,
        session:String,
        description:String,
        attended:String,
        vote:String,
        justification:String
    }],
    attendanceIn2018: [{
        description: String,
        days: Number,
        percentage:String
    }],
    recentPropositions: [{
        title: String,
        status: String,
        date: String,
        details:String
    }]

});

module.exports = {Deputy};


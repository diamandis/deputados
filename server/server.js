const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('./db/mongoose');
const {Deputy} = require('./model/deputy');
const hbs = require('hbs');
const moment = require('moment');

let app = express();

app.set('view engine', 'hbs');
app.use(bodyParser.json());

app.get('/api/data',async (req,res)=> {	
	try {
		const deputyList = await Deputy.find();
		if(!deputyList) {
			return res.status(404).send();
		}
		res.render('index.hbs',{list:deputyList,createdAt: moment().format('dddd, DD/MM/YYYY HH:mm')});
	} catch(e) {
		return res.status(400).send();
	}	
});

app.get('/api/data/:id',async (req,res)=> {	
	const id = req.params.id;
	try {
		const deputy = await Deputy.findOne({siteId: id});
		if(!deputy) {
			return res.status(404).send();
		}
		res.render('details.hbs',deputy);
	} catch(e) {
		return res.status(400).send();
	}	
});

app.post('/api/data', async (req,res)=>{
	const deputy = new Deputy(req.body);	
	try {
		await deputy.save();
		res.send(deputy);
	} catch(err) {
		res.status(400).send(err);
	}
});

app.listen(3000,()=> {
    console.log('Server up on port 3000');
});

module.exports = {app}
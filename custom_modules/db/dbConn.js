/**
 * Created by claytonherendeen on 10/24/15.
 */
var express = require('express');
var router = express.Router();


var mongo = require('mongoskin');
var db = mongo.db("mongodb://localhost:27017/uno", {native_parser:true});

router.db = db; // bind db to module

module.exports = router;
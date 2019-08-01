var express = require('express');
var router = express.Router();
const FabricClient = require('../fabric/client.js');
const client = new FabricClient();

router.get('/create', function(req, res, next) {
  res.render('createProduct');
})

/* GET products listing. */
router.get('/:productId', function(req, res, next) {
  var productRequest = new Promise((resolve, reject) => {
    try{
      var product = client.query('admin', 'queryProduct', [req.params.productId]);
      resolve(product);
    }catch(error){
      reject(error);
    }
  });
  var userRequest = new Promise((resolve, request) => {
    var users = client.listUsers();
    resolve(users);
  })
    Promise.all([productRequest, userRequest]).then((data) => {
      res.render('product', {product: data[0], users: data[1]} );
    });

  });

module.exports = router;

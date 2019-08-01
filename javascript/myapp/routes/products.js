var express = require('express');
var router = express.Router();

router.get('/create', function(req, res, next) {
  res.render('createProduct');
})

/* GET products listing. */
router.get('/:productId', function(req, res, next) {
    res.render('product');
});

module.exports = router;

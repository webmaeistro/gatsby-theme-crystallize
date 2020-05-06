/* eslint-disable no-underscore-dangle */
<<<<<<< HEAD
const config = require('../../.env');
const vippsApiCall = require('./_utils/.vipps-utils');
const normallizer = require('./_normalizer/.vipps');
const {
  persistCrystallizeOrder
} = require('./_utils/_crystallize-order-handler');
=======
const config = require('../../config');
const vippsApiCall = require('../../utils/vipps-utils.js');
const normallizer = require('../../utils/normalizers/vipps');
const {
  persistCrystallizeOrder
} = require('../../../lib/crystallize-order-handler');
>>>>>>> d5e8465c32d297ce2f5f8a84cf831c8c3d3484cd

const { VIPPS_MERCHANT_SERIAL, NGROK_URL } = config;

const orderToVippsCart = lineItems => {
  let totalCartAmount = 0;

  const cartItems = lineItems.map(item => {
    totalCartAmount += item.product_tax_amount;

    return item;
  });

  return {
    cart: cartItems,
    totalCartAmount: totalCartAmount
  };
};

const orderToVippsBody = (
  orderDetails,
  lineItems,
  personalDetails,
  crystallizeOrderId
) => {
  const { totalCartAmount } = orderToVippsCart(lineItems);

  return {
    merchantInfo: {
      merchantSerialNumber: VIPPS_MERCHANT_SERIAL,
      callbackPrefix: `${NGROK_URL}/api/order-persistence/vipps`,
<<<<<<< HEAD
      //   shippingDetailsPrefix: NGROK_URL,
=======
         shippingDetailsPrefix: NGROK_URL,
>>>>>>> d5e8465c32d297ce2f5f8a84cf831c8c3d3484cd
      consentRemovalPrefix: NGROK_URL,
      paymentType: 'eComm Express Payment',
      fallBack: NGROK_URL,
      isApp: false
    },
    customerInfo: {
      mobileNumber: personalDetails.phone
    },
    transaction: {
      orderId: crystallizeOrderId,
      amount: totalCartAmount,
      transactionText: 'Crystallize Boilerplate Test Transaction',
      staticShippingDetails: [
        {
          isDefault: 'Y',
          priority: 0,
          shippingCost: 0,
          shippingMethod: 'Free delivery',
          shippingMethodId: 'free-delivery'
        }
      ]
    }
  };
};

export default async (req, res) => {
  try {
    const { personalDetails, lineItems, currency } = req.body;
    const { metadata } = req.body;
    const mutationBody = normallizer(
      {},
      { lineItems, currency, personalDetails }
    );

    const { data } = await persistCrystallizeOrder(mutationBody);

     await vippsApiCall({
         method: 'POST',
         uri: '/ecomm/v2/payments',
         body: orderToVippsBody(req.body, lineItems)
       });
    console.log(data.orders.create.id);
    return res.send({
      body: orderToVippsBody(
        req.body,
        lineItems,
        personalDetails,
        data.orders.create.id
      )
    });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      error: error.stack
    });
  }
};
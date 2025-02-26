// plugin.ts

import axios from 'axios';
import process from 'process';
import webito, { paymentsCreate_input, paymentsCreate_output, paymentsVerify_input } from 'webito-plugin-sdk'

const starter = new webito.WebitoPlugin('starter');

starter.registerHook(
    webito.hooks.paymentsCreate,
    async ({ variables, data }: { variables: { feebyuser: boolean, apikey: string }, data: paymentsCreate_input }) => {
        const inputdata =
        {
            "price_amount": data.amount,
            "price_currency": data.gateway.currency.code,
            "order_id": data.payment,
            "order_description": data.payment,
            "ipn_callback_url": data.callback,
            "success_url": data.callback,
            "cancel_url": data.callback,
            "is_fixed_rate": true,
            "is_fee_paid_by_user": variables.feebyuser
        }
        const create = await axios.post('https://api.nowpayments.io/v1/invoice', inputdata, {
            headers: {
                'x-api-key': variables.apikey,
                'Content-Type': 'application/json'
            }
        })
        if (create.data.invoice_url) {
            return {
                status: true,
                data: {
                    ...(create.data || {}),
                    url: create.data.invoice_url
                }
            }
        } else {
            return {
                status: false,
            }
        }
    });

starter.registerHook(
    webito.hooks.paymentsVerify,
    async ({ variables, data }: { variables: { apikey: string }, data: paymentsVerify_input }) => {

        const verify = await axios.get(('https://api.nowpayments.io/v1/payment/' + data.payment.transaction.id), {
            headers: {
                'x-api-key': variables.apikey,
                'Content-Type': 'application/json'
            }
        })

        if (verify.data.payment_status == 'finished') {
            return {
                status: true,
            }
        } else {
            return {
                status: true,
            }
        }
    });

const runPlugin = async (inputData: { hook: string; data: any }) => {
    const result = await starter.executeHook(inputData.hook, inputData.data);
    return result;
};


process.stdin.on('data', async (input) => {
    const msg = JSON.parse(input.toString());
    const result: any = await runPlugin(msg);
    starter.response({ status: result?.status, data: result?.data })
});
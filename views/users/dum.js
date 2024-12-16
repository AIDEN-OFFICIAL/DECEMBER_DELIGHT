const verifyPayment = async (req, res) => {
    try {
        console.log(verify payment)
        const { orderId, status } = req.body;
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
            .update(sign.toString())
            .digest("hex");

        console.log('Signature comparison:', {
            received: razorpay_signature,
            expected: expectedSign
        });

        if (razorpay_signature === expectedSign) {
            const updateOrder = await Orders.findByIdAndUpdate(orderId,
                {
                    $set: {paymentStatus: status, status:"Order Placed" }
                },
                { new: true }
            );
            console.log('Updated order:', updateOrder);
            res.status(200).json({ success: true, message: "Payment verified successfully" });
        } else if(razorpay_signature !== expectedSign){
            const order = await Orders.findById(orderId);
            if (!order) {
                console.log('Order not found:', orderId);
                return res.status(404).json({ error: "Order not found" });
            }
            const updateOrder = await Orders.findByIdAndUpdate(orderId,
                {
                    $set: {paymentStatus: status, status:"Payment failed" }
                },
                { new: true }
            );
            console.log('Updated order:', updateOrder);
            res.status(200).json({ success: true, message: "Order payment failed", order: updateOrder });
        }else{
            res.status(200).json({ success: false, message: "Payment verification failed" });
        }
    } catch (error) {
        console.error("Payment verification error:", error);
        res.status(500).json({ success: false, error: "Payment verification failed" });
    }
};
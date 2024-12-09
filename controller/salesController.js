const User = require('../models/userSchema');
const Product = require('../models/productSchema');
const Cart = require('../models/cartSchema');
const Order = require('../models/orderSchema');
const Address = require('../models/addressSchema');
const XLSX = require('xlsx');

const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    // Build query filters
    let filters = {};
    if (startDate && endDate) {
      filters.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    if (status) {
      filters.status = status;
    }

    // Correctly populate the product details in orderItems
    const orders = await Order.find(filters)
      .populate({
        path: 'orderItems.productId',
        model: 'Product',
      })
      .populate('address')
      .lean();

    // Calculate metrics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.totalOrderPrice,
      0
    );
    const totalDiscounts = orders.reduce(
      (sum, order) => sum + order.discount,
      0
    );
    const revenueAfterDiscounts = totalRevenue - totalDiscounts;

    const orderStatusStats = orders.reduce((stats, order) => {
      stats[order.status] = (stats[order.status] || 0) + 1;
      return stats;
    }, {});

    const paymentStats = orders.reduce((stats, order) => {
      stats[order.paymentMethod] = (stats[order.paymentMethod] || 0) + 1;
      return stats;
    }, {});

    res.render('salesReport', {
      totalOrders,
      totalRevenue,
      totalDiscounts,
      revenueAfterDiscounts,
      orderStatusStats,
      paymentStats,
      orders,
      filters: { startDate, endDate, status },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching sales report' });
  }
};

const getSalesReportExcel = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    // Build the filter query
    const filter = {};
    if (startDate) {
      filter.createdAt = { ...filter.createdAt, $gte: new Date(startDate) };
    }
    if (endDate) {
      filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate) };
    }
    if (status) {
      filter.status = status;
    }

    // Fetch filtered orders
    const orders = await Order.find(filter)
      .populate('userId', 'name email')
      .populate({
        path: 'orderItems.productId',
        model: 'Product',
      })
      .populate('address')
      .lean();
    // Map orders to the Excel format
    const salesData = orders.map(order => ({
      OrderID: order.orderId,
      Date: order.invoiceDate 
        ? new Date(order.invoiceDate).toISOString().split('T')[0]
        : new Date(order.createdAt).toISOString().split('T')[0],
      User: order.userId?.name || 'N/A',
      Email: order.userId?.email || 'N/A',
      Status: order.status,
      TotalPrice: order.totalOrderPrice || 0,
      Discount: order.discount || 0,
      FinalAmount: order.finalAmount || order.totalOrderPrice || 0,
      PaymentMethod: order.paymentMethod,
    }));

    // Create an Excel worksheet
    const worksheet = XLSX.utils.json_to_sheet(salesData);

    // Create a workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report');

    // Write the workbook to a buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader('Content-Disposition', 'attachment; filename="sales-report.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Send the buffer
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).send('Failed to generate Excel file.');
  }
}
module.exports = {
  getSalesReport,
  getSalesReportExcel,
};

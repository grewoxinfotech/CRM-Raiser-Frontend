import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Typography,
  Select,
  Row,
  Col,
  Divider,
  DatePicker,
  message,
} from "antd";
import {
  FiFileText,
  FiX,
  FiCalendar,
  FiUser,
  FiHash,
  FiBriefcase,
  FiCreditCard,
  FiTag,
  FiDollarSign,
} from "react-icons/fi";
import dayjs from "dayjs";
import { useCreateCreditNoteMutation } from "./services/creditNoteApi";
import "./creditnotes.scss";
import { useGetCustomersQuery } from "../customer/services/custApi";
import { useGetInvoicesQuery } from "../invoice/services/invoiceApi";
import { useGetAllCurrenciesQuery } from "../../../../superadmin/module/settings/services/settingsApi";

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CreateCreditNotes = ({ open, onCancel }) => {
  const [form] = Form.useForm();
  const [createCreditNote, { isLoading }] = useCreateCreditNoteMutation();
  const { data: custdata } = useGetCustomersQuery();
  const customers = custdata?.data;

  const { data: invdata, refetch: refetchInvoices } = useGetInvoicesQuery();
  const invoices = invdata?.data;

  const { data: currenciesData } = useGetAllCurrenciesQuery();
  const [selectedCurrency, setSelectedCurrency] = useState("₹");

  const handleCurrencyChange = (value) => {
    const currencyDetails = currenciesData?.find((curr) => curr.id === value);
    if (currencyDetails) {
      setSelectedCurrency(currencyDetails.currencyIcon || "₹");
    }
  };

  const handleInvoiceChange = (value) => {
    const selectedInvoice = invoices?.find((inv) => inv.id === value);
    if (selectedInvoice) {
      // Calculate remaining amount
      const remainingAmount =
        Number(selectedInvoice.amount || 0) -
        Number(selectedInvoice.creditNoteAmount || 0);

      // Validate if invoice can be used for credit note
      if (remainingAmount <= 0) {
        message.error("This invoice has no remaining amount for credit note");
        form.setFieldValue("invoice", undefined);
        return;
      }

      if (selectedInvoice.payment_status === "paid") {
        message.error("Cannot create credit note for paid invoice");
        form.setFieldValue("invoice", undefined);
        return;
      }

      // Find customer name from customer data
      const customerDetails = customers?.find(
        (cust) => cust.id === selectedInvoice.customer
      );

      // Set amount from invoice remaining amount
      form.setFieldValue("amount", remainingAmount);

      // Set currency from invoice
      form.setFieldValue("currency", selectedInvoice.currency);

      // Set customer name and ID
      form.setFieldValue("customer", customerDetails?.name || "");
      form.setFieldValue("customer_id", selectedInvoice.customer);

      // Update selected currency icon
      const currencyDetails = currenciesData?.find(
        (curr) => curr.id === selectedInvoice.currency
      );
      if (currencyDetails) {
        setSelectedCurrency(currencyDetails.currencyIcon || "₹");
      }

      // Store selected invoice remaining amount for validation
      form.setFieldValue("max_amount", remainingAmount);
    }
  };

    const handleSubmit = async (values) => {
    try {
      // Check if amount is 0 or less
      if (!values.amount || values.amount <= 0) {
        message.error("Please enter a valid amount");
        return;
      }
      
      // Check if amount contains decimal and prevent form submission
      if (values.amount.toString().includes('.')) {
        message.error("Form cannot be submitted with decimal values. Please enter a whole number.");
        // Don't allow form submission with decimal values
        return;
      }

      // Check if credit note amount exceeds remaining amount
      const remainingAmount = form.getFieldValue("max_amount");
      if (parseFloat(values.amount) > parseFloat(remainingAmount)) {
        message.error("Credit note amount cannot exceed remaining amount");
        return;
      }

      const creditNoteData = {
        invoice: values.invoice || "",
        customer: values.customer || "",
        currency: values.currency || "",
        amount: parseFloat(values.amount) || 0,
        description: values.description || "",
        date: values.date ? values.date.format("YYYY-MM-DD") : "",
      };

      const response = await createCreditNote(creditNoteData).unwrap();
      if (response.success === false) {
        throw new Error(response.message);
      }
      message.success("Credit note created successfully");
      // Refetch invoices data to update the list
      await refetchInvoices();
      form.resetFields();
      onCancel();
    } catch (error) {
      console.error("Submit Error:", error);
      message.error(error?.data?.message || "Failed to create credit note");
    }
  };

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={800}
      destroyOnClose={true}
      centered
      closeIcon={null}
      className="pro-modal custom-modal"
      styles={{
        body: {
          padding: 0,
          borderRadius: "8px",
          overflow: "hidden",
        },
      }}
    >
      <div
        className="modal-header"
        style={{
          background: "linear-gradient(135deg, #4096ff 0%, #1677ff 100%)",
          padding: "24px",
          color: "#ffffff",
          position: "relative",
        }}
      >
        <Button
          type="text"
          onClick={onCancel}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            color: "#ffffff",
            width: "32px",
            height: "32px",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255, 255, 255, 0.2)",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
          }}
        >
          <FiX style={{ fontSize: "20px" }} />
        </Button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FiFileText style={{ fontSize: "24px", color: "#ffffff" }} />
          </div>
          <div>
            <h2
              style={{
                margin: "0",
                fontSize: "24px",
                fontWeight: "600",
                color: "#ffffff",
              }}
            >
              Create Credit Note
            </h2>
            <Text
              style={{
                fontSize: "14px",
                color: "rgba(255, 255, 255, 0.85)",
              }}
            >
              Fill in the information to create credit note
            </Text>
          </div>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
        className="credit-notes-form"
        style={{
          padding: "24px",
        }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Form.Item
              name="invoice"
              label={
                <span style={{ fontSize: "14px", fontWeight: "500" }}>
                  <FiHash style={{ marginRight: "8px", color: "#1890ff" }} />
                  Invoice <span style={{ color: "#ff4d4f" }}>*</span>
                </span>
              }
              rules={[{ required: true, message: "Please select invoice" }]}
            >
              <Select
                placeholder="Select Invoice"
                showSearch
                optionFilterProp="children"
                size="large"
                onChange={handleInvoiceChange}
                style={{
                  width: "100%",
                  borderRadius: "10px",
                }}
              >
                {invoices
                  ?.filter((invoice) => {
                    // Check if invoice is not paid
                    const isNotPaid = invoice.payment_status !== "paid";

                    // Calculate remaining amount (amount - credit notes)
                    const remainingAmount =
                      Number(invoice.amount || 0) -
                      Number(invoice.creditNoteAmount || 0);

                    // Only show invoices that are not paid and have remaining amount greater than 0
                    return isNotPaid && remainingAmount > 0;
                  })
                  .map((invoice) => {
                    // Calculate remaining amount for display
                    const remainingAmount =
                      Number(invoice.amount || 0) -
                      Number(invoice.creditNoteAmount || 0);

                    return (
                      <Option key={invoice.id} value={invoice.id}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>{invoice.salesInvoiceNumber}</span>
                          <span
                            style={{ color: "#1890ff", paddingLeft: "100px" }}
                          >
                            Remaining: {selectedCurrency}
                            {remainingAmount.toFixed(2)}
                          </span>
                        </div>
                      </Option>
                    );
                  })}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Form.Item
              name="customer"
              className="customer-field"
              label={
                <span style={{ fontSize: "14px", fontWeight: "500" }}>
                  <FiUser style={{ marginRight: "8px", color: "#1890ff" }} />
                  Customer <span style={{ color: "#ff4d4f" }}>*</span>
                </span>
              }
              rules={[{ required: true, message: "Please select customer" }]}
            >
              <Input
                disabled
                size="large"
                style={{
                  width: "100%",
                  borderRadius: "10px",
                  height: "48px",
                  backgroundColor: "#f8fafc",
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Hidden field to store customer_id */}
        <Form.Item name="customer_id" hidden>
          <Input />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Form.Item
              name="date"
              label={
                <span style={{ fontSize: "14px", fontWeight: "500" }}>
                  <FiCalendar
                    style={{ marginRight: "8px", color: "#1890ff" }}
                  />
                  Date
                </span>
              }
              rules={[{ required: true, message: "Please select date" }]}
              style={{ marginTop: "22px" }}
            >
              <DatePicker
                size="large"
                format="DD-MM-YYYY"
                style={{
                  width: "100%",
                  borderRadius: "10px",
                  height: "48px",
                  backgroundColor: "#f8fafc",
                }}
                suffixIcon={<FiCalendar style={{ color: "#1890ff" }} />}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Form.Item
              name="currency"
              label={
                <span style={{ fontSize: "14px", fontWeight: "500" }}>
                  <FiCreditCard
                    style={{ marginRight: "8px", color: "#1890ff" }}
                  />
                  Currency <span style={{ color: "#ff4d4f" }}>*</span>
                </span>
              }
              rules={[{ required: true, message: "Please select currency" }]}
              style={{ marginTop: "22px" }}
            >
              <Select
                size="large"
                placeholder="Select currency"
                onChange={handleCurrencyChange}
                disabled
                style={{
                  width: "100%",
                  borderRadius: "10px",
                }}
                suffixIcon={<FiCreditCard style={{ color: "#1890ff" }} />}
              >
                {currenciesData?.map((currency) => (
                  <Option key={currency.id} value={currency.id}>
                    {currency.currencyName} ({currency.currencyIcon})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Form.Item
              name="amount"
              label={
                <span style={{ fontSize: "14px", fontWeight: "500" }}>
                  <FiDollarSign
                    style={{ marginRight: "8px", color: "#1890ff" }}
                  />
                  Amount <span style={{ color: "#ff4d4f" }}>*</span>
                </span>
              }
              style={{ marginTop: "22px" }}
              rules={[
                { required: true, message: "Please enter amount" },
                {
                  validator(_, value) {
                    if (value && value.toString().includes('.')) {
                      // Don't clear the field, let validation error show
                      return Promise.reject(
                        new Error("Only enter whole numbers, do not enter decimal values")
                      );
                    }
                    return Promise.resolve();
                  }
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || value <= 0) {
                      return Promise.reject(
                        new Error("Amount must be greater than zero")
                      );
                    }
                    const maxAmount = getFieldValue("max_amount");
                    if (
                      !maxAmount ||
                      parseFloat(value) <= parseFloat(maxAmount)
                    ) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Amount cannot exceed due amount")
                    );
                  },
                }),
              ]}
            >
                              <Input
                type="number"
                prefix={
                  <span style={{ color: "#1890ff", fontSize: "16px" }}>
                    {selectedCurrency}
                  </span>
                }
                placeholder="Enter amount (whole numbers only)"
                size="large"
                style={{
                  borderRadius: "10px",
                  padding: "8px 16px",
                  height: "48px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e6e8eb",
                  transition: "all 0.3s ease",
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value && value.includes('.')) {
                    // Show error message for decimal values
                    message.error("Only enter whole numbers, do not enter decimal values");
                    // Don't clear field, let the user see the decimal value
                  }
                }}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value && value.includes('.')) {
                    // Show error immediately when decimal is typed
                    message.warning("Only enter whole numbers, do not enter decimal values");
                    // Don't clear the field, let user see what they typed
                  }
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}></Row>

        <Form.Item
          name="description"
          label={
            <span style={{ fontSize: "14px", fontWeight: "500" }}>
              Description
            </span>
          }
          style={{ marginTop: "22px" }}
        >
          <TextArea
            placeholder="Enter description"
            rows={4}
            style={{
              borderRadius: "10px",
              padding: "12px 16px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e6e8eb",
            }}
          />
        </Form.Item>

        <Divider style={{ margin: "24px 0" }} />

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
          }}
        >
          <Button
            size="large"
            onClick={onCancel}
            style={{
              padding: "8px 24px",
              height: "44px",
              borderRadius: "10px",
              border: "1px solid #e6e8eb",
              fontWeight: "500",
            }}
          >
            Cancel
          </Button>
                      <Button
            size="large"
            type="primary"
            htmlType="submit"
            style={{
              padding: "8px 32px",
              height: "44px",
              borderRadius: "10px",
              fontWeight: "500",
              background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
              border: "none",
              boxShadow: "0 4px 12px rgba(24, 144, 255, 0.15)",
            }}
            onClick={() => {
              // Final check before form submission
              const amountValue = form.getFieldValue("amount");
              if (amountValue && amountValue.toString().includes('.')) {
                message.error("Form cannot be submitted with decimal values. Please enter a whole number.");
                return false; // Prevent form submission
              }
            }}
          >
            Create Credit Note
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateCreditNotes;

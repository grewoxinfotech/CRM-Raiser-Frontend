import React, { useState, useEffect } from "react";
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
  InputNumber,
  DatePicker,
  Space,
  message,
  Switch,
} from "antd";
import {
  FiFileText,
  FiX,
  FiUser,
  FiCalendar,
  FiHash,
  FiDollarSign,
  FiPlus,
  FiTrash2,
  FiPackage,
  FiCreditCard,
  FiPhone,
} from "react-icons/fi";
import dayjs from "dayjs";
import "./invoice.scss";
import {
  useGetCustomersQuery,
  useCreateCustomerMutation,
} from "../customer/services/custApi";
import { useGetAllCurrenciesQuery } from "../../../../superadmin/module/settings/services/settingsApi";
import { useGetAllTaxesQuery } from "../../settings/tax/services/taxApi";
import { useGetProductsQuery } from "../product&services/services/productApi";
import { useUpdateInvoiceMutation } from "./services/invoiceApi";
import { useGetContactsQuery } from "../../crm/contact/services/contactApi";
import { useGetCompanyAccountsQuery } from "../../crm/companyacoount/services/companyAccountApi";
import { selectCurrentUser } from "../../../../auth/services/authSlice";
import { useSelector } from "react-redux";
import { useGetAllCountriesQuery } from "../../../../superadmin/module/settings/services/settingsApi";
const { Text } = Typography;
const { Option } = Select;

const EditInvoice = ({ open, onCancel, onSubmit, initialValues }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [updateInvoice] = useUpdateInvoiceMutation();
  const { data: custdata } = useGetCustomersQuery();
  const customers = custdata?.data || [];
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerForm] = Form.useForm();
  const [createCustomer] = useCreateCustomerMutation();
  const { data: currenciesData } = useGetAllCurrenciesQuery();
  const [selectedCurrency, setSelectedCurrency] = useState("₹");
  const [selectedCurrencyId, setSelectedCurrencyId] = useState(null);
  const [isTaxEnabled, setIsTaxEnabled] = useState(true);
  const { data: taxesData, isLoading: taxesLoading } = useGetAllTaxesQuery();
  const loggedInUser = useSelector(selectCurrentUser);
  const { data: productsData, isLoading: productsLoading } =
    useGetProductsQuery(loggedInUser?.id);
  const [selectedProductCurrency, setSelectedProductCurrency] = useState(null);

  const [isCurrencyDisabled, setIsCurrencyDisabled] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("customer");
  const { data: contactsData } = useGetContactsQuery();
  const { data: companyAccountsData } = useGetCompanyAccountsQuery();

  const contacts = contactsData?.data;
  const companyAccounts = companyAccountsData?.data;

  const { data: countries = [], isLoading: countriesLoading } =
    useGetAllCountriesQuery({
      page: 1,
      limit: 100,
    });
  console.log(initialValues, "initialValues");

  const [paymentStatus, setPaymentStatus] = useState(
    initialValues?.payment_status || "unpaid"
  );

  const handleCustomerChange = (value) => {
    const selectedCustomer = customers?.find((c) => c.id === value);
    const customerName = selectedCustomer?.name || "";
    form.setFieldsValue({
      customer: value,
      customerName: customerName,
    });
  };

  useEffect(() => {
    if (initialValues) {
      let items = [];
      try {
        items =
          typeof initialValues.items === "string"
            ? JSON.parse(initialValues.items)
            : initialValues.items || [];

        // Ensure items is always an array
        items = Array.isArray(items) ? items : [items];
      } catch (error) {
        console.error("Error parsing items:", error);
        items = [];
      }

      // Always enable tax toggle by default
      setIsTaxEnabled(true);

      // Set initial category to customer always
      setSelectedCategory("customer");

      // Find the selected customer and their name and tax number
      const selectedCustomer = customers?.find(
        (c) => c.id === initialValues.customer
      );
      const customerName = selectedCustomer?.name || "null";
      const taxNumber = selectedCustomer?.tax_number || "";

      // Format initial values for the form
      const formattedValues = {
        category: "customer", // Always set to customer
        customer: initialValues.customer,
        customerName: customerName,
        tax_number: taxNumber,
        issueDate: initialValues.issueDate
          ? dayjs(initialValues.issueDate, "YYYY-MM-DD")
          : null,
        dueDate: initialValues.dueDate
          ? dayjs(initialValues.dueDate, "YYYY-MM-DD")
          : null,
        referenceNumber: initialValues.salesInvoiceNumber,
        currency: initialValues.currency,
        status: initialValues.payment_status,
        items: items.map((item) => {
          // Use tax data directly from item instead of looking for matches
          return {
            product: item.product_id,
            id: item.product_id,
            item_name: item.name,
            quantity: Number(item.quantity) || 0,
            unit_price: Number(item.unit_price) || 0,
            discount: Number(item.discount) || 0,
            discount_type: item.discount_type || "percentage",
            tax: Number(item.tax_percentage || item.tax || 0),
            taxId: null, // Not using taxId anymore
            tax_name: item.tax_name || "",
            hsn_sac: item.hsn_sac || "",
            taxAmount: Number(item.tax_amount) || 0,
          };
        }),
        subtotal: Number(initialValues.subtotal) || 0,
        totalTax: Number(initialValues.tax) || 0,
        totalDiscount: Number(initialValues.discount) || 0,
        totalAmount: Number(initialValues.total) || 0,
        additionalNotes: initialValues.additional_notes || "",
      };

      // Set form values
      form.setFieldsValue(formattedValues);

      console.log(formattedValues, "formattedValues");

      // Set currency details
      const selectedCurrency = currenciesData?.find(
        (c) => c.id === initialValues.currency
      );
      if (selectedCurrency) {
        setSelectedCurrency(selectedCurrency.currencyIcon);
        setSelectedCurrencyId(selectedCurrency.id);
      }

      // Calculate initial totals
      calculateTotals(formattedValues.items);

      // Set initial product if exists
      if (items.length > 0) {
        const firstItem = items[0];
        form.setFieldValue("product_id", firstItem.product_id);

        // Find and set product currency if exists
        const selectedProduct = productsData?.data?.find(
          (product) => product.id === firstItem.product_id
        );
        if (selectedProduct) {
          const productCurrency = currenciesData?.find(
            (c) => c.id === selectedProduct.currency
          );
          if (productCurrency) {
            setSelectedProductCurrency(productCurrency);
            setSelectedCurrency(productCurrency.currencyIcon);
            setSelectedCurrencyId(productCurrency.id);
            setIsCurrencyDisabled(true);
          }
        }
      }
    }
  }, [
    initialValues,
    form,
    currenciesData,
    customers,
    contacts,
    companyAccounts,
    productsData,
  ]);

  const calculateItemTaxAmount = (item) => {
    if (!item) return 0;
    if (!isTaxEnabled || !item.tax) return 0;

    const quantity = Number(item.quantity) || 0;
    const price = Number(item.unit_price) || 0;
    const itemAmount = quantity * price;

    // Calculate discount first
    const itemDiscount = Number(item.discount || 0);
    const itemDiscountType = item.discount_type || "percentage";
    let itemDiscountAmount = 0;

    if (itemDiscountType === "percentage") {
      itemDiscountAmount = (itemAmount * itemDiscount) / 100;
    } else {
      itemDiscountAmount = itemDiscount;
    }

    // Calculate tax on amount after discount
    const amountAfterDiscount = itemAmount - itemDiscountAmount;
    const taxRate = Number(item.tax) || 0;
    return (amountAfterDiscount * taxRate) / 100;
  };

  const calculateItemTotal = (item) => {
    if (!item) return 0;

    const quantity = Number(item.quantity) || 0;
    const price = Number(item.unit_price) || 0;
    const itemAmount = quantity * price;

    // Calculate discount
    const itemDiscount = Number(item.discount || 0);
    const itemDiscountType = item.discount_type || "percentage";
    let itemDiscountAmount = 0;

    if (itemDiscountType === "percentage") {
      itemDiscountAmount = (itemAmount * itemDiscount) / 100;
    } else {
      itemDiscountAmount = itemDiscount;
    }

    // Calculate tax
    const taxAmount = isTaxEnabled ? calculateItemTaxAmount(item) : 0;

    // Final item total: amount - discount + tax
    return itemAmount - itemDiscountAmount + taxAmount;
  };

  const calculateTotals = (items = []) => {
    let subtotal = 0;
    let totalTaxAmount = 0;
    let totalDiscountAmount = 0;

    // Calculate totals from items
    items.forEach((item) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      const itemAmount = quantity * price;

      // Calculate item discount
      const itemDiscount = Number(item.discount || 0);
      const itemDiscountType = item.discount_type || "percentage";
      let itemDiscountAmount = 0;

      if (itemDiscountType === "percentage") {
        itemDiscountAmount = (itemAmount * itemDiscount) / 100;
      } else {
        itemDiscountAmount = itemDiscount;
      }

      // Calculate tax on amount after discount
      const amountAfterDiscount = itemAmount - itemDiscountAmount;
      const taxRate = Number(item.tax) || 0;
      const itemTaxAmount = (amountAfterDiscount * taxRate) / 100;

      subtotal += itemAmount;
      totalTaxAmount += itemTaxAmount;
      totalDiscountAmount += itemDiscountAmount;
    });

    // Final total = subtotal + tax - discount
    const totalAmount = subtotal + totalTaxAmount - totalDiscountAmount;

    form.setFieldsValue({
      subtotal: subtotal.toFixed(2),
      total_tax: totalTaxAmount.toFixed(2),
      total_discount: totalDiscountAmount.toFixed(2),
      total: totalAmount.toFixed(2),
    });
  };

  const handleItemChange = () => {
    const items = form.getFieldValue("items");
    calculateTotals(items);
  };

  const handleCurrencyChange = (value, option) => {
    const currency = currenciesData?.find((c) => c.id === value);
    if (currency) {
      setSelectedCurrency(currency.currencyIcon);
      setSelectedCurrencyId(value);

      // Update all prices with new currency
      const items = form.getFieldValue("items") || [];
      const updatedItems = items.map((item) => ({
        ...item,
        unit_price: item.unit_price || 0,
      }));
      form.setFieldsValue({ items: updatedItems });
      calculateTotals(updatedItems);
    }
  };

  const handleProductSelect = (value, option) => {
    const selectedProduct = productsData?.data?.find(
      (product) => product.id === value
    );
    if (selectedProduct) {
      // Get the product's currency from currencies list
      const productCurrency = currenciesData?.find(
        (c) => c.id === selectedProduct.currency
      );
      if (productCurrency) {
        setSelectedProductCurrency(productCurrency);
        setSelectedCurrency(productCurrency.currencyIcon);
        setSelectedCurrencyId(productCurrency.id);
        setIsCurrencyDisabled(true);
      }

      // Update the items list
      const items = form.getFieldValue("items") || [];
      const newItems = [...items];
      const lastIndex = newItems.length - 1;
      newItems[lastIndex] = {
        ...newItems[lastIndex],
        id: selectedProduct.id,
        item_name: selectedProduct.name,
        unit_price: selectedProduct.selling_price,
        hsn_sac: selectedProduct.hsn_sac,
        tax: selectedProduct.tax,
        profilePic: selectedProduct.image,
        currency: selectedProduct.currency,
      };
      form.setFieldsValue({ items: newItems });
      calculateTotals(newItems);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      // Format items for backend
      const formattedItems = values.items?.map((item) => {
        const itemTaxAmount = isTaxEnabled ? calculateItemTaxAmount(item) : 0;
        return {
          product_id: item.id || "",
          name: item.item_name || "",
          quantity: Number(item.quantity) || 0,
          unit_price: Number(item.unit_price) || 0,
          tax: null, // Not using tax ID anymore
          tax_name: isTaxEnabled ? (item.tax_name || "") : "",
          tax_percentage: isTaxEnabled ? (Number(item.tax) || 0) : 0,
          tax_amount: Number(itemTaxAmount) || 0,
          discount: Number(item.discount) || 0,
          discount_type: item.discount_type || "percentage",
          hsn_sac: item.hsn_sac || "",
          amount: Number(calculateItemTotal(item)) || 0,
        };
      });

      // Calculate total tax amount from all items
      const totalTaxAmount = Array.isArray(formattedItems) ? 
        formattedItems.reduce(
          (sum, item) => sum + (Number(item.tax_amount) || 0),
          0
        ) : 0;

      // Calculate total discount amount from all items
      const totalDiscountAmount = Array.isArray(formattedItems) ?
        formattedItems.reduce((sum, item) => {
          const itemAmount = Number(item.quantity) * Number(item.unit_price);
          let discountAmount = 0;
          if (item.discount_type === "percentage") {
            discountAmount = (itemAmount * (Number(item.discount) || 0)) / 100;
          } else {
            discountAmount = Number(item.discount) || 0;
          }
          return sum + discountAmount;
        }, 0) : 0;

      // Ensure all values are serializable
      const payload = {
        category: selectedCategory || "",
        customer: values.customer || "",
        section: "sales-invoice",
        issueDate: values.issueDate ? values.issueDate.format("YYYY-MM-DD") : "",
        dueDate: values.dueDate ? values.dueDate.format("YYYY-MM-DD") : "",
        currency: selectedCurrencyId || values.currency || "",
        items: Array.isArray(formattedItems) ? formattedItems : [],
        subtotal: Number(values.subtotal) || 0,
        tax: Number(totalTaxAmount) || 0,
        discount: Number(totalDiscountAmount) || 0,
        total: Number(values.total) || 0,
        payment_status: values.status || "unpaid",
        additional_notes: values.additionalNotes || "",
      };

      // For debugging
      console.log("Sending payload:", JSON.stringify(payload));

      const response = await updateInvoice({
        id: initialValues.id,
        data: payload,
      }).unwrap();
      
      if (response.success === false) {
        throw new Error(response.message);
      }
      
      message.success("Invoice updated successfully");
      onCancel();
    } catch (error) {
      message.error(error?.message || "Failed to update invoice");
      console.error("Submit Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (values) => {
    try {
      // Find the country ID from the selected phone code
      const selectedCountry = countries?.find(
        (c) => c.phoneCode === values.phonecode
      );
      if (!selectedCountry) {
        message.error("Please select a valid phone code");
        return;
      }

      const result = await createCustomer({
        name: values.name,
        contact: values.contact,
        phonecode: selectedCountry.id, // Use country ID instead of phone code
      }).unwrap();

      message.success("Customer created successfully");
      setIsCustomerModalOpen(false);
      customerForm.resetFields();

      // Automatically select the newly created customer
      form.setFieldValue("customer", result.data.id);
    } catch (error) {
      message.error("Failed to create customer: " + error.message);
    }
  };

  // Reset form when modal is closed
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const customerModal = (
    <Modal
      title={null}
      open={isCustomerModalOpen}
      onCancel={() => {
        setIsCustomerModalOpen(false);
        customerForm.resetFields();
      }}
      footer={null}
      width={500}
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
        style={{
          background: "linear-gradient(135deg, #4096ff 0%, #1677ff 100%)",
          padding: "24px",
          color: "#ffffff",
          position: "relative",
        }}
      >
        <Button
          type="text"
          onClick={() => {
            setIsCustomerModalOpen(false);
            customerForm.resetFields();
          }}
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
            <FiUser style={{ fontSize: "24px", color: "#ffffff" }} />
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
              Create New Customer
            </h2>
            <Text
              style={{
                fontSize: "14px",
                color: "rgba(255, 255, 255, 0.85)",
              }}
            >
              Add a new customer to the system
            </Text>
          </div>
        </div>
      </div>

      <Form
        form={customerForm}
        layout="vertical"
        onFinish={handleCreateCustomer}
        requiredMark={false}
        style={{
          padding: "24px",
        }}
      >
        <Form.Item
          name="name"
          label="Customer Name"
          rules={[{ required: true, message: "Please enter customer name" }]}
        >
          <Input
            prefix={<FiUser style={{ color: "#1890ff" }} />}
            placeholder="Enter customer name"
            size="large"
            style={{
              borderRadius: "8px",
              height: "40px",
              backgroundColor: "#f8fafc",
            }}
          />
        </Form.Item>

        <Form.Item
          name="phone"
          label={
            <span style={{ fontSize: "14px", fontWeight: "500" }}>
              Phone Number <span style={{ color: "#ff4d4f" }}>*</span>
            </span>
          }
          style={{ marginTop: "12px" }}
        >
          <Input.Group
            compact
            className="phone-input-group"
            style={{
              display: "flex",
              height: "48px",
              backgroundColor: "#f8fafc",
              borderRadius: "10px",
              border: "1px solid #e6e8eb",
              overflow: "hidden",
            }}
          >
            <Form.Item name="phonecode" noStyle initialValue="+91">
              <Select
                size="large"
                style={{
                  width: "120px",
                  height: "48px",
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "white",
                  cursor: "pointer",
                }}
                loading={countriesLoading}
                className="phone-code-select"
                dropdownStyle={{
                  padding: "8px",
                  borderRadius: "10px",
                  backgroundColor: "white",
                }}
                showSearch
                optionFilterProp="children"
                defaultValue="+91"
              >
                {countries?.map((country) => (
                  <Option
                    key={country.id}
                    value={country.phoneCode}
                    style={{ cursor: "pointer" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#262626",
                        cursor: "pointer",
                      }}
                    >
                      <span>
                        {country.countryCode} {country.phoneCode}
                      </span>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="contact" noStyle>
              <Input
                size="large"
                type="number"
                style={{
                  flex: 1,
                  border: "none",
                  borderLeft: "1px solid #e6e8eb",
                  borderRadius: 0,
                  height: "46px",
                  backgroundColor: "transparent",
                  display: "flex",
                  alignItems: "center",
                }}
                placeholder="Enter 10-digit phone number"
                maxLength={10}
              />
            </Form.Item>
          </Input.Group>
        </Form.Item>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "24px",
          }}
        >
          <Button
            size="large"
            onClick={() => {
              setIsCustomerModalOpen(false);
              customerForm.resetFields();
            }}
            style={{
              padding: "8px 24px",
              height: "44px",
              borderRadius: "8px",
              border: "1px solid #e6e8eb",
              fontWeight: "500",
            }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            size="large"
            htmlType="submit"
            style={{
              padding: "8px 24px",
              height: "44px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
            }}
          >
            Create Customer
          </Button>
        </div>
      </Form>
    </Modal>
  );

  // Add this function to get entity name based on ID
  const getEntityNameById = (category, id) => {
    switch (category) {
      case "customer":
        const customer = customers?.find((c) => c.id === id);
        return customer?.name || "";
      case "contact":
        const contact = contacts?.find((c) => c.id === id);
        return (
          contact?.name ||
          `${contact?.first_name || ""} ${contact?.last_name || ""}`.trim() ||
          contact?.contact_name ||
          ""
        );
      case "company_account":
        const account = companyAccounts?.find((c) => c.id === id);
        return (
          account?.company_name || account?.name || account?.account_name || ""
        );
      default:
        return "";
    }
  };

  return (
    <Modal
      title={null}
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={1300}
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
          onClick={handleCancel}
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
              Edit Invoice
            </h2>
            <Text
              style={{
                fontSize: "14px",
                color: "rgba(255, 255, 255, 0.85)",
              }}
            >
              Update invoice information
            </Text>
          </div>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
        style={{
          padding: "24px",
        }}
      >
        <div
         className="create-invoice-form-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "16px",
          }}
        >
          {/* <Form.Item
        name="category"
        label={
          <span style={{ fontSize: "14px", fontWeight: "500" }}>
            <FiUser style={{ marginRight: "8px", color: "#1890ff" }} />
            Invoice Type <span style={{ color: "#ff4d4f" }}>*</span>
          </span>
        }
        rules={[{ required: true, message: "Please select category" }]}
        initialValue="customer"
      >
        <Select
          placeholder="Select Category"
          onChange={handleCategoryChange}
          size="large"
          disabled={true}
          style={{
            width: "100%",
            borderRadius: "10px",
          }}
        >
          <Option value="customer">Customer</Option>
        </Select>
      </Form.Item> */}

          <Form.Item
            name="customer"
            label={
              <span style={{ fontSize: "14px", fontWeight: "500" }}>
                <FiUser style={{ marginRight: "8px", color: "#1890ff" }} />
                Customer <span style={{ color: "#ff4d4f" }}>*</span>
              </span>
            }
            rules={[
              { required: true, message: `Please select ${selectedCategory}` },
            ]}
          >
            <Select
              listHeight={100}
              dropdownStyle={{
                Height: "100px",
                overflowY: "auto",
                scrollbarWidth: "thin",
                scrollBehavior: "smooth",
              }}
              placeholder="Select Customer"
              showSearch
              optionFilterProp="children"
              size="large"
              style={{
                width: "100%",
                borderRadius: "10px",
              }}
              onChange={(value) => {
                const selectedCustomer = customers?.find((c) => c.id === value);
                if (selectedCustomer) {
                  form.setFieldValue(
                    "tax_number",
                    selectedCustomer.tax_number || ""
                  );
                }
                form.setFieldValue("customer", value);
                handleCustomerChange(value);
              }}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <Divider style={{ margin: "8px 0" }} />
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <Button
                      type="primary"
                      icon={<FiPlus />}
                      onClick={() => setIsCustomerModalOpen(true)}
                      style={{
                        width: "100%",
                        background:
                          "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                        border: "none",
                        height: "40px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        boxShadow: "0 2px 8px rgba(24, 144, 255, 0.15)",
                        fontWeight: "500",
                      }}
                    >
                      Add Customer
                    </Button>
                  </div>
                </>
              )}
            >
              {customers?.map((customer) => (
                <Option key={customer.id} value={customer.id}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "4px 0",
                    }}
                  >
                    <FiUser style={{ color: "#1890ff" }} />
                    <span>{customer.name}</span>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="tax_number"
            label={
              <span style={{ fontSize: "14px", fontWeight: "500" }}>
                <FiHash style={{ marginRight: "8px", color: "#1890ff" }} />
                GSTIN
              </span>
            }
          >
            <Input
              disabled
              placeholder="Tax number"
              size="large"
              style={{
                borderRadius: "10px",
                padding: "8px 16px",
                height: "48px",
                backgroundColor: "#f8fafc",
                border: "1px solid #e6e8eb",
              }}
            />
          </Form.Item>
          <Form.Item
            name="currency"
            label={
              <span className="form-label">
                Currency <span className="required"></span>
              </span>
            }
            rules={[{ required: true, message: "Please select currency" }]}
          >
            <Select
              placeholder="Select Currency"
              size="large"
              value={selectedCurrencyId}
              onChange={handleCurrencyChange}
              disabled={isCurrencyDisabled}
              style={{
                width: "100%",
                borderRadius: "10px",
              }}
              optionLabelProp="label"
            >
              {currenciesData?.map((currency) => (
                <Option
                  key={currency.id}
                  value={currency.id}
                  label={`${currency.currencyName} (${currency.currencyIcon})`}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>{currency.currencyIcon}</span>
                    <span>{currency.currencyName}</span>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>
        {/* </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "16px",
          }}
        > */}
          <Form.Item
            name="issueDate"
            label={
              <span className="form-label">
                Issue Date <span className="required"></span>
              </span>
            }
            rules={[{ required: true, message: "Please select issue date" }]}
            style={{ marginTop: "12px" }}
          >
            <DatePicker
              format="DD-MM-YYYY"
              size="large"
              style={{
                width: "100%",
                borderRadius: "10px",
                height: "48px",
                backgroundColor: "#f8fafc",
              }}
              suffixIcon={<FiCalendar style={{ color: "#1890ff" }} />}
            />
          </Form.Item>
          <Form.Item
            name="dueDate"
            label={
              <span className="form-label">
                Due Date <span className="required"></span>
              </span>
            }
            rules={[{ required: true, message: "Please select due date" }]}
            style={{ marginTop: "12px" }}
          >
            <DatePicker
              format="DD-MM-YYYY"
              size="large"
              style={{
                width: "100%",
                borderRadius: "10px",
                height: "48px",
                backgroundColor: "#f8fafc",
              }}
              suffixIcon={<FiCalendar style={{ color: "#1890ff" }} />}
            />
          </Form.Item>
          <Form.Item
            name="status"
            label={
              <span className="form-label">
                Status <span className="required"></span>
              </span>
            }
            rules={[{ required: true, message: "Please select status" }]}
            style={{ marginTop: "12px" }}
          >
            <Select
              placeholder="Select Status"
              size="large"
              style={{
                width: "100%",
                borderRadius: "10px",
              }}
              onChange={(value) => setPaymentStatus(value)}
              disabled={true}
            >
              <Option value="paid">Paid</Option>
              <Option value="unpaid">Unpaid</Option>
            </Select>
          </Form.Item>
        </div>

        <div className="table-style-container">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "16px",
              marginBottom: "16px",
              marginLeft: "16px",
              marginRight: "16px",
            }}
          >
            <span
              style={{ fontSize: "16px", fontWeight: "500", color: "#1f2937" }}
            >
              <FiPackage style={{ marginRight: "8px", color: "#1890ff" }} />
              Items & Services
            </span>
            <div style={{ display: "flex", alignItems: "center" }}>
              <Text style={{ marginRight: "8px" }}>Enable Tax</Text>
              <Switch
                checked={isTaxEnabled}
                onChange={(checked) => {
                  setIsTaxEnabled(checked);
                  if (!checked) {
                    const items = form.getFieldValue("items") || [];
                    items.forEach((item) => {
                      item.tax = 0;
                      item.taxId = undefined;
                    });
                    form.setFieldsValue({ items });
                  }
                  calculateTotals(form.getFieldValue("items"));
                }}
                size="small"
              />
            </div>
          </div>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
              <div className="invoice-items-table-wrapper">
                <table className="invoice-items-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>HSN/SAC</th>
                      <th>Discount</th>
                      <th>Tax</th>
                      <th>Amount</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map(({ key, name, ...restField }, index) => (
                      <tr key={key} className="item-data-row">
                        <td>
                          <Form.Item
                            {...restField}
                            name={[name, "item_name"]}
                            rules={[{ required: true, message: "Required" }]}
                            style={{marginTop:"-10px"}}
                          >
                            <Select
                              showSearch
                              placeholder="Select Product"
                              optionFilterProp="children"
                              style={{ width: "100%" }}
                              disabled={paymentStatus === "paid"}
                              onChange={(value) => {
                                const selectedProduct =
                                  productsData?.data?.find(
                                    (product) => product.id === value
                                  );
                                if (selectedProduct) {
                                  const productCurrency = currenciesData?.find(
                                    (c) => c.id === selectedProduct.currency
                                  );
                                  if (productCurrency) {
                                    setSelectedProductCurrency(productCurrency);
                                    setSelectedCurrency(
                                      productCurrency.currencyIcon
                                    );
                                    setSelectedCurrencyId(productCurrency.id);
                                    setIsCurrencyDisabled(true);
                                  }

                                  const items =
                                    form.getFieldValue("items") || [];
                                  items[index] = {
                                    ...items[index],
                                    id: selectedProduct.id,
                                    item_name: selectedProduct.name,
                                    unit_price: selectedProduct.selling_price,
                                    hsn_sac: selectedProduct.hsn_sac,
                                    tax: selectedProduct.tax,
                                    profilePic: selectedProduct.image,
                                    currency: selectedProduct.currency,
                                  };
                                  form.setFieldsValue({
                                    items,
                                    currency: selectedProduct.currency,
                                  });
                                  calculateTotals(items);
                                }
                              }}
                            >
                              {productsData?.data?.map((product) => (
                                <Option key={product.id} value={product.id}>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "10px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: "30px",
                                        height: "30px",
                                        borderRadius: "4px",
                                        overflow: "hidden",
                                      }}
                                    >
                                      <img
                                        src={product.image}
                                        alt={product.name}
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "cover",
                                        }}
                                      />
                                    </div>
                                    <div
                                      style={{
                                        display: "flex",
                                        flexDirection: "column",
                                      }}
                                    >
                                      <span style={{ fontWeight: 500 }}>
                                        {product.name}
                                      </span>
                                    </div>
                                  </div>
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </td>
                        <td>
                          <Form.Item
                            {...restField}
                            name={[name, "quantity"]}
                            rules={[
                              { required: true, message: "Required" },
                              {
                                validator: (_, value) => {
                                  if (!value) return Promise.resolve();
                                  if (!Number.isInteger(value)) {
                                    return Promise.reject(
                                      "Please enter a valid quantity"
                                    );
                                  }
                                  if (value < 1) {
                                    return Promise.reject(
                                      "Quantity must be at least 1"
                                    );
                                  }
                                  return Promise.resolve();
                                },
                              },
                            ]}
                            initialValue={1}
                            style={{ height: "48px",marginTop:"-10px",width:"70px" }}
                          >
                            <InputNumber
                              min={1}
                              precision={0}
                              className="quantity-input"
                              style={{padding:"0px"}}
                              disabled={paymentStatus === "paid"}
                              onChange={() =>
                                calculateTotals(form.getFieldValue("items"))
                              }
                            />
                          </Form.Item>
                        </td>
                        <td>
                          <Form.Item
                            {...restField}
                            name={[name, "unit_price"]}
                            rules={[{ required: true, message: "Required" }]}
                            style={{width:"120px"}}
                          >
                            <InputNumber
                              className="price-input"
                              min={0}
                              disabled={true}
                              style={{padding:"0px"}}
                              onChange={() =>
                                calculateTotals(form.getFieldValue("items"))
                              }
                              formatter={(value) =>
                                `${selectedCurrency}${value}`.replace(
                                  /\B(?=(\d{3})+(?!\d))/g,
                                  ","
                                )
                              }
                              parser={(value) => value.replace(/[^\d.]/g, "")}
                            />
                          </Form.Item>
                        </td>
                        <td>
                          <Form.Item {...restField} name={[name, "hsn_sac"]} style={{width:"120px"}} >
                            <Input
                              placeholder="HSN/SAC"
                              className="hsn-input"
                              disabled={true}
                            />
                          </Form.Item>
                        </td>
                        <td>
                          <Form.Item
                            {...restField}
                            name={[name, "discount"]}
                            style={{ marginTop: "-8px" }}
                          >
                            <Space>
                              <Form.Item
                                {...restField}
                                name={[name, "discount_type"]}
                                style={{ margin: 0 }}
                              >
                                <Select
                                  size="large"
                                  style={{
                                    width: "100%",
                                    borderRadius: "8px",
                                    height: "48px",
                                  }}
                                  defaultValue="percentage"
                                  disabled={paymentStatus === "paid"}
                                  onChange={() =>
                                    calculateTotals(form.getFieldValue("items"))
                                  }
                                >
                                  <Option value="percentage">Percentage</Option>
                                  <Option value="fixed">Fixed Amount</Option>
                                </Select>
                              </Form.Item>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <Form.Item
                                  {...restField}
                                  name={[name, "discount"]}
                                  style={{ margin: 0 }}
                                >
                                  <InputNumber
                                    className="item-discount-input"
                                    placeholder={
                                      form.getFieldValue("items")?.[index]
                                        ?.discount_type === "fixed"
                                        ? "Amount"
                                        : "%"
                                    }
                                    disabled={paymentStatus === "paid"}
                                    formatter={(value) => {
                                      if (!value && value !== 0) return "";
                                      return value
                                        .toString()
                                        .replace(/[^\d.]/g, "");
                                    }}
                                    parser={(value) => {
                                      const parsed = value?.replace(
                                        /[^\d.]/g,
                                        ""
                                      );
                                      return parsed || "0";
                                    }}
                                    onStep={(value) => {
                                      const items = form.getFieldValue("items");
                                      if (items?.[index]) {
                                        items[index].discount = value || 0;
                                        form.setFieldsValue({ items });
                                        calculateTotals(items);
                                      }
                                    }}
                                    onChange={(value) => {
                                      const items = form.getFieldValue("items");
                                      if (items?.[index]) {
                                        items[index].discount = value || 0;
                                        form.setFieldsValue({ items });
                                        calculateTotals(items);
                                      }
                                    }}
                                    onKeyUp={() => {
                                      calculateTotals(
                                        form.getFieldValue("items")
                                      );
                                    }}
                                    style={{
                                      width: "100px",
                                      borderRadius: "8px",
                                      height: "40px",
                                       padding:"0px"
                                    }}
                                  />
                                </Form.Item>
                                <Text style={{ marginLeft: "4px" }}>
                                  {form.getFieldValue("items")?.[index]
                                    ?.discount_type === "fixed"
                                    ? selectedCurrency
                                    : "%"}
                                </Text>
                              </div>
                            </Space>
                          </Form.Item>
                        </td>
                        <td>
                          <Form.Item
                            {...restField}
                            name={[name, "tax_info"]}
                            style={{ marginTop: "-8px" }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
                              <Input
                                value={isTaxEnabled ? 
                                  (form.getFieldValue("items")?.[index]?.tax_name && form.getFieldValue("items")?.[index]?.tax > 0
                                    ? `${form.getFieldValue("items")?.[index]?.tax_name} ${form.getFieldValue("items")?.[index]?.tax || 0}%` 
                                    : "No Tax") 
                                  : "No Tax"}
                                placeholder="No Tax"
                                readOnly
                                disabled={!isTaxEnabled || paymentStatus === "paid"}
                                style={{ width: "120px",height:"48px" }}
                              />
                              {isTaxEnabled && paymentStatus !== "paid" && (
                                <>
                                  {form.getFieldValue("items")?.[index]?.tax_name && form.getFieldValue("items")?.[index]?.tax > 0 ? (
                                    // Show remove button if tax exists
                                    <Button
                                      type="text"
                                      icon={<FiX style={{ color: "#ff4d4f" }} />}
                                      onClick={() => {
                                        // Get current items
                                        const items = form.getFieldValue("items") || [];
                                        
                                        // Store original tax values in temp fields before clearing
                                        if (items[index]) {
                                          items[index] = {
                                            ...items[index],
                                            _original_tax_name: items[index].tax_name,
                                            _original_tax: items[index].tax,
                                            tax_name: "",
                                            tax: 0,
                                            taxAmount: 0,
                                          };
                                          
                                          form.setFieldsValue({ items });
                                          calculateTotals(items);
                                        }
                                      }}
                                      style={{ 
                                        padding: "2px", 
                                        display: "flex", 
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderRadius: "50%",
                                        background: "#fff0f0",
                                        marginLeft: "4px",
                                        height: "20px",
                                        width: "20px",
                                        border: "1px solid #ffccc7"
                                      }}
                                    />
                                  ) : (
                                    // Show add button if tax was removed or doesn't exist
                                    <Button
                                      type="text"
                                      icon={<FiPlus style={{ color: "#52c41a" }} />}
                                      onClick={() => {
                                        // Get current items
                                        const items = form.getFieldValue("items") || [];
                                        
                                        // Check if we have original tax values or need to get from product
                                        if (items[index]) {
                                          const originalTaxName = items[index]._original_tax_name;
                                          const originalTax = items[index]._original_tax;
                                          
                                          // If we have stored original values, restore them
                                          if (originalTaxName || originalTax) {
                                            items[index] = {
                                              ...items[index],
                                              tax_name: originalTaxName || "",
                                              tax: originalTax || 0,
                                            };
                                          } 
                                          // Otherwise try to get from product data
                                          else if (items[index].id) {
                                            const product = productsData?.data?.find(p => p.id === items[index].id);
                                            if (product) {
                                              items[index] = {
                                                ...items[index],
                                                tax_name: product.tax_name || "Tax",
                                                tax: product.tax_percentage || product.tax || 10, // Default to 10% if no tax found
                                              };
                                            } else {
                                              // If no product or tax found, set default values
                                              items[index] = {
                                                ...items[index],
                                                tax_name: "Tax",
                                                tax: 10, // Default 10% tax
                                              };
                                            }
                                          } else {
                                            // If no product ID, set default values
                                            items[index] = {
                                              ...items[index],
                                              tax_name: "Tax",
                                              tax: 10, // Default 10% tax
                                            };
                                          }
                                          
                                          form.setFieldsValue({ items });
                                          calculateTotals(items);
                                        }
                                      }}
                                      style={{ 
                                        padding: "2px", 
                                        display: "flex", 
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderRadius: "50%",
                                        background: "#f6ffed",
                                        marginLeft: "4px",
                                        height: "20px",
                                        width: "20px",
                                        border: "1px solid #b7eb8f"
                                      }}
                                    />
                                  )}
                                </>
                              )}
                            </div>
                          </Form.Item>
                        </td>
                        <td>
                          <div className="amount-fields" style={{marginTop:"-8px"}}>
                            <span className="currency-symbols">
                              {selectedCurrency}
                            </span>
                            <span className="amount-values">
                              {calculateItemTotal(
                                form.getFieldValue("items")[index]
                              )?.toFixed(2) || "0.00"}
                            </span>
                          </div>
                        </td>
                        <td>
                          {fields.length > 1 && (
                            <Button
                              type="text"
                              icon={<FiTrash2 style={{ color: "#ff4d4f" }} />}
                              disabled={paymentStatus === "paid"}
                              onClick={() => {
                                remove(name);
                                calculateTotals(form.getFieldValue("items"));
                              }}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>

                <div className="add-item-container">
                  <Button
                    type="primary"
                    icon={<FiPlus />}
                    onClick={() => add()}
                    className="add-item-btn"
                    disabled={paymentStatus === "paid"}
                  >
                    Add Items
                  </Button>
                </div>
              </>
            )}
          </Form.List>
        </div>

        <div className="summary-card">
          <div className="summary-content">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                // marginBottom: "16px",
                padding: "12px",
                background: "#f8fafc",
                borderRadius: "8px",
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: "15px", color: "#4b5563", fontWeight: 500 }}
              >
                Sub Total
              </Text>
              <Form.Item name="subtotal" style={{ margin: 0 }}>
                <InputNumber
                  disabled
                  size="large"
                  style={{
                    width: "150px",
                    borderRadius: "8px",
                    height: "45px",
                    backgroundColor: "#fff",
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                    fontSize: "16px",
                    fontWeight: "500",
                  }}
                  formatter={(value) =>
                    `${selectedCurrency}${value}`.replace(
                      /\B(?=(\d{3})+(?!\d))/g,
                      ","
                    )
                  }
                />
              </Form.Item>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                // marginBottom: "16px",
                padding: "12px",
                background: "#f8fafc",
                borderRadius: "8px",
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: "15px", color: "#4b5563", fontWeight: 500 }}
              >
                Total Discount
              </Text>
              <Form.Item name="total_discount" style={{ margin: 0 }}>
                <InputNumber
                  disabled
                  size="large"
                  style={{
                    width: "150px",
                    borderRadius: "8px",
                    height: "45px",
                    backgroundColor: "#fff",
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                    fontSize: "16px",
                    fontWeight: "500",
                  }}
                  formatter={(value) =>
                    `${selectedCurrency}${value}`.replace(
                      /\B(?=(\d{3})+(?!\d))/g,
                      ","
                    )
                  }
                />
              </Form.Item>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "16px",
                padding: "12px",
                background: "#f8fafc",
                borderRadius: "8px",
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: "15px", color: "#4b5563", fontWeight: 500 }}
              >
                Total Tax
              </Text>
              <Form.Item name="total_tax" style={{ margin: 0 }}>
                <InputNumber
                  disabled
                  size="large"
                  style={{
                    width: "150px",
                    borderRadius: "8px",
                    height: "45px",
                    backgroundColor: "#fff",
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                    fontSize: "16px",
                    fontWeight: "500",
                  }}
                  formatter={(value) =>
                    `${selectedCurrency}${value}`.replace(
                      /\B(?=(\d{3})+(?!\d))/g,
                      ","
                    )
                  }
                />
              </Form.Item>
            </div>
            <Divider style={{ margin: "20px 0", borderColor: "#e5e7eb" }} />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "16px",
                background:
                  "linear-gradient(135deg, #1890ff08 0%, #096dd908 100%)",
                borderRadius: "8px",
                alignItems: "center",
                border: "1px solid #1890ff20",
              }}
            >
              <Text
                style={{ fontSize: "16px", color: "#1f2937", fontWeight: 600 }}
              >
                Total Amount
              </Text>
              <Form.Item name="total" style={{ margin: 0 }}>
                <InputNumber
                  disabled
                  size="large"
                  style={{
                    width: "150px",
                    borderRadius: "8px",
                    height: "45px",
                    backgroundColor: "#fff",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1890ff",
                  }}
                  formatter={(value) =>
                    `${selectedCurrency}${value}`.replace(
                      /\B(?=(\d{3})+(?!\d))/g,
                      ","
                    )
                  }
                />
              </Form.Item>
            </div>
          </div>
        </div>

        <div className="form-footer">
          <Button onClick={handleCancel} className="cancel-btn">
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="create-btn"
          >
            Update Invoice
          </Button>
        </div>
      </Form>
      {customerModal}
    </Modal>
  );
};

export default EditInvoice;

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
  Upload,
  message,
  InputNumber,
  Divider,
} from "antd";
import {
  FiBox,
  FiTag,
  FiUpload,
  FiDollarSign,
  FiHash,
  FiFileText,
  FiX,
  FiPackage,
  FiAlertCircle,
  FiTrendingUp,
  FiPercent,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiType,
  FiInfo,
  FiPlus,
  FiUser,
  FiChevronDown,
} from "react-icons/fi";
import { useCreateProductMutation } from "./services/productApi";
import { useGetAllCurrenciesQuery } from "../../../../superadmin/module/settings/services/settingsApi";
import { useGetCategoriesQuery } from "../../crm/crmsystem/souce/services/SourceApi";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../../../auth/services/authSlice";
import "./product.scss";
import AddCategoryModal from "../../crm/crmsystem/category/AddCategoryModal";

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CreateProduct = ({
  visible,
  onClose,
  onSubmit,
  loading,
  currenciesData,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const currentUser = useSelector(selectCurrentUser);
  const [createProduct] = useCreateProductMutation();
  const [addCategoryVisible, setAddCategoryVisible] = useState(false);
  const { data: categoriesData } = useGetCategoriesQuery(currentUser?.id);
  const [selectedCurrency, setSelectedCurrency] = useState(null);

  const categories =
    categoriesData?.data?.filter((item) => item.lableType === "category") || [];

  // Watch for stock-related field changes
  useEffect(() => {
    const updateStockStatus = () => {
      const stockQuantity = form.getFieldValue("stock_quantity") || 0;
      const minStockLevel = form.getFieldValue("min_stock_level") || 0;

      let newStatus = "in_stock";
      if (stockQuantity <= 0) {
        newStatus = "out_of_stock";
      } else if (stockQuantity <= minStockLevel) {
        newStatus = "low_stock";
      }

      form.setFieldsValue({ stock_status: newStatus });
    };

    // Subscribe to field changes
    const { stock_quantity, min_stock_level } = form.getFieldsValue();
    if (stock_quantity !== undefined || min_stock_level !== undefined) {
      updateStockStatus();
    }
  }, [
    form.getFieldValue("stock_quantity"),
    form.getFieldValue("min_stock_level"),
  ]);

  // Find INR currency and set as default
  useEffect(() => {
    if (currenciesData) {
      const inrCurrency = currenciesData.find(c => c.currencyCode === 'INR');
      if (inrCurrency) {
        setSelectedCurrency(inrCurrency);
        form.setFieldsValue({
          currency: inrCurrency.id,
          currencyIcon: inrCurrency.currencyIcon,
          currencyCode: inrCurrency.currencyCode
        });
      }
    }
  }, [currenciesData, form]);

  const stockStatusOptions = [
    {
      value: "in_stock",
      label: "In Stock",
      icon: <FiCheckCircle style={{ color: "#52c41a" }} />,
      color: "#52c41a",
      description: "Product is available",
    },
    {
      value: "low_stock",
      label: "Low Stock",
      icon: <FiAlertTriangle style={{ color: "#faad14" }} />,
      color: "#faad14",
      description: "Stock is below minimum level",
    },
    {
      value: "out_of_stock",
      label: "Out of Stock",
      icon: <FiXCircle style={{ color: "#ff4d4f" }} />,
      color: "#ff4d4f",
      description: "Product is not available",
    },
  ];

  const handleSubmit = async (values) => {
    try {
      // Check for decimal values in numeric fields and prevent form submission
      const numericFields = ['buying_price', 'selling_price',  
                           'stock_quantity', 'min_stock_level', 'max_stock_level', 'reorder_quantity'];
      
      for (const field of numericFields) {
        if (values[field] && values[field].toString().includes('.')) {
          message.error(`Form cannot be submitted with decimal values. Please enter whole numbers only for ${field.replace('_', ' ')}.`);
          return; // Prevent form submission
        }
      }
      
      const formData = new FormData();

      formData.append("name", values.name);
      formData.append("category", values.category);
      formData.append("buying_price", values.buying_price);
      formData.append("selling_price", values.selling_price);
      formData.append("currency", selectedCurrency?.id || values.currency);
      formData.append("currencyIcon", selectedCurrency?.currencyIcon || '₹');
      formData.append("currencyCode", selectedCurrency?.currencyCode || 'INR');
      formData.append("sku", values.sku || "");
      formData.append("tax", values.tax || "");
      formData.append("tax_name", values.tax_name || "");
      formData.append("tax_percentage", values.tax_percentage || 0);
      formData.append("hsn_sac", values.hsn_sac || "");
      formData.append("description", values.description || "");
      formData.append("stock_quantity", values.stock_quantity || 0);
      formData.append("min_stock_level", values.min_stock_level || 0);
      formData.append("max_stock_level", values.max_stock_level || "");
      formData.append("reorder_quantity", values.reorder_quantity || "");
      formData.append("stock_status", values.stock_status || "in_stock");
      formData.append("created_by", currentUser?.username || "");

      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("image", fileList[0].originFileObj);
      }

      console.log("🚀 ~ handleSubmit ~ formData:", formData)
      await onSubmit(formData);
      form.resetFields();
      setFileList([]);
    } catch (error) {
      message.error(error?.data?.message || "Failed to create product");
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    onClose();
  };

  const uploadProps = {
    beforeUpload: (file) => {
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error("You can only upload image files!");
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error("Image must be smaller than 2MB!");
        return false;
      }
      return false;
    },
    onChange: ({ fileList }) => setFileList(fileList),
    fileList,
  };

  const handleAddCategory = () => {
    setAddCategoryVisible(true);
  };

  // Add validation rules for stock quantities
  const validateStockQuantities = {
    max_stock_level: [
      { required: true, message: "Please enter maximum stock level" },
      ({ getFieldValue }) => ({
        validator(_, value) {
          const stockQuantity = getFieldValue("stock_quantity");
          if (!value || !stockQuantity || value >= stockQuantity) {
            return Promise.resolve();
          }
          return Promise.reject(
            new Error(
              "Maximum stock level must be greater than current stock quantity"
            )
          );
        },
      }),
    ],
    stock_quantity: [
      { required: true, message: "Please enter stock quantity" },
      ({ getFieldValue }) => ({
        validator(_, value) {
          const maxStock = getFieldValue("max_stock_level");
          const minStock = getFieldValue("min_stock_level");

          if (maxStock && value > maxStock) {
            return Promise.reject(
              new Error("Stock quantity cannot exceed maximum stock level")
            );
          }
          if (minStock && value < minStock) {
            return Promise.reject(
              new Error(
                "Stock quantity cannot be less than minimum stock level"
              )
            );
          }
          return Promise.resolve();
        },
      }),
    ],
    min_stock_level: [
      { required: true, message: "Please enter minimum stock level" },
      // { max: 20, message: "Minimum stock level cannot be more than 20" },
      ({ getFieldValue }) => ({
        validator(_, value) {
          if (!value) return Promise.resolve();

          const stockQuantity = getFieldValue("stock_quantity");
          const reorderQuantity = getFieldValue("reorder_quantity");

          if (value > stockQuantity) {
            return Promise.reject(
              new Error(
                "Minimum stock level cannot be greater than current stock quantity"
              )
            );
          }
          if (reorderQuantity && value < reorderQuantity) {
            return Promise.reject(
              new Error(
                "Minimum stock level must be greater than reorder quantity"
              )
            );
          }
          return Promise.resolve();
        },
      }),
    ],
    reorder_quantity: [
      { required: true, message: "Please enter reorder quantity" },
      // { max: 20, message: "Reorder quantity cannot be more than 20" },
      ({ getFieldValue }) => ({
        validator(_, value) {
          if (!value) return Promise.resolve();

          const minStock = getFieldValue("min_stock_level");
          if (minStock && value > minStock) {
            return Promise.reject(
              new Error(
                "Reorder quantity must be less than minimum stock level"
              )
            );
          }
          return Promise.resolve();
        },
      }),
    ],
  };

  // Update form field change handler
  const handleBuyingPriceChange = (value) => {
    form.setFieldsValue({ buying_price: value });
    form.validateFields(['selling_price']);
  };

  const handleSellingPriceChange = (value) => {
    form.setFieldsValue({ selling_price: value });
    if (form.getFieldValue('buying_price')) {
      form.validateFields(['selling_price']);
    }
  };

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={800}
      destroyOnClose={true}
      centered
      closeIcon={null}
      className="pro-modal custom-modal"
      style={{
        "--antd-arrow-background-color": "#ffffff",
      }}
      styles={{
        body: {
          padding: 0,
          borderRadius: "8px",
          overflow: "hidden",
        },
        mask: {
          backgroundColor: "rgba(0, 0, 0, 0.45)",
        },
        content: {
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        },
      }}
    >
      <div
        className="modal-header"
        style={{
          background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
          padding: "24px",
          color: "#ffffff",
          position: "relative",
        }}
      >
        <Button
          type="text"
          icon={<FiX />}
          onClick={handleCancel}
          style={{
            color: "#ffffff",
            position: "absolute",
            right: "24px",
            top: "24px",
          }}
        />
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
            <FiBox style={{ fontSize: "24px", color: "#ffffff" }} />
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
              Create New Product
            </h2>
            <Text
              style={{
                fontSize: "14px",
                color: "rgba(255, 255, 255, 0.85)",
              }}
            >
              Fill in the information to create product
            </Text>
          </div>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="lead-form custom-form"
        style={{ padding: "24px" }}
      >
        {/* Basic Information Section */}
        <div className="section-title" style={{ marginBottom: "16px" }}>
          <Text strong style={{ fontSize: "16px", color: "#1f2937" }}>
            Basic Information
          </Text>
        </div>
        <div
          className="form-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <Form.Item
            name="name"
            label={
              <span style={{ color: "#374151", fontWeight: 500 }}>
                Product Name <span style={{ color: "#ff4d4f" }}>*</span>
              </span>
            }
            rules={[{ required: true, message: "Please enter product name" },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  if (!/[a-z]/.test(value) && !/[A-Z]/.test(value)) {
                    return Promise.reject(
                      new Error('Product name must contain both uppercase or lowercase English letters')
                    );
                  }
                  return Promise.resolve();
                }
              }
            ]}
            // colon={false}
          >
            <Input
              prefix={<FiBox style={{ color: "#9CA3AF" }} />}
              placeholder="Enter product name"
              style={{ height: "48px", borderRadius: "10px" }}
            />
          </Form.Item>

          <Form.Item
            name="category"
            label={
              <span style={{ color: "#374151", fontWeight: 500 }}>
                Category <span style={{ color: "#ff4d4f" }}>*</span>
              </span>
            }
            rules={[{ required: true, message: "Please select a category" }]}
          >
            <Select
              placeholder="Select category"
              style={{ width: "100%", height: "48px" }}
              listHeight={100}
              dropdownStyle={{
                Height: "100px",
                overflowY: "auto",
                scrollbarWidth: "thin",
                scrollBehavior: "smooth",
              }}
              dropdownRender={(menu) => (
                <div onClick={(e) => e.stopPropagation()}>
                  {menu}
                  <Divider style={{ margin: "8px 0" }} />
                  <div
                    style={{
                      padding: "8px 12px",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <Button
                      type="primary"
                      icon={<FiPlus />}
                      onClick={handleAddCategory}
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
                      Add Category
                    </Button>
                  </div>
                </div>
              )}
            >
              {categories.map((category) => (
                <Option key={category.id} value={category.id}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: category.color || "#1890ff",
                      }}
                    />
                    {category.name}
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <Divider />

        {/* Pricing Details */}
        <div className="section-title" style={{ marginBottom: "16px" }}>
          <Text strong style={{ fontSize: "16px", color: "#1f2937" }}>
            Pricing Details
          </Text>
        </div>
        <div
          className="form-grid"
          style={{
            display: "grid",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <Form.Item
            name="buying_price"
            label={
              <span style={{ color: "#374151", fontWeight: 500 }}>
                Buying Price <span style={{ color: "#ff4d4f" }}>*</span>
              </span>
            }
            rules={[
              { required: true, message: "Please enter buying price" },
              {
                validator: (_, value) => {
                  if (!value) return Promise.reject('Please enter buying price');
                  if (value <= 0) {
                    return Promise.reject('Buying price must be greater than 0');
                  }
                  if (value && value.toString().includes('.')) {
                    return Promise.reject('Only enter whole numbers, do not enter decimal values');
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <div className="price-input-group" style={{
              display: "flex",
              height: "48px",
              backgroundColor: "#f8fafc",
              borderRadius: "10px",
              border: "1px solid #e6e8eb",
              overflow: "hidden",
              marginBottom: 0,
            }}>
              <Form.Item name="currency" noStyle>
                <div style={{
                  width: "100px",
                  height: "48px",
                  background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "10px 0 0 10px",
                  fontWeight: 500,
                }}>
                  <span>{selectedCurrency?.currencyIcon || '₹'}</span>
                  <span style={{ marginLeft: '4px' }}>{selectedCurrency?.currencyCode || 'INR'}</span>
                </div>
              </Form.Item>
              <InputNumber
                placeholder="Enter buying price"
                size="large"
                style={{
                  flex: 1,
                  width: "100%",
                  border: "none",
                  borderLeft: "1px solid #e6e8eb",
                  borderRadius: 0,
                  height: "48px",
                  padding: "0 16px",
                }}
                min={1}
                className="price-input"
                parser={value => {
                  const parsedValue = parseFloat(value);
                  if (isNaN(parsedValue)) return '';
                  if (value && value.toString().includes('.')) {
                    message.warning("Only enter whole numbers, do not enter decimal values");
                    // Keep the decimal value visible but show warning
                    return parsedValue;
                  }
                  return parsedValue;
                }}
                onChange={handleBuyingPriceChange}
              />
            </div>
          </Form.Item>

          <Form.Item
            name="selling_price"
            label={
              <span style={{ color: "#374151", fontWeight: 500 }}>
                Selling Price <span style={{ color: "#ff4d4f" }}>*</span>
              </span>
            }
            rules={[
              { required: true, message: "Please enter selling price" },
              ({ getFieldValue }) => ({
                async validator(_, value) {
                  // if (!value) return Promise.reject('Please enter selling price');
                  if (value <= 0) {
                    return Promise.reject('Selling price must be greater than 0');
                  }
                  if (value && value.toString().includes('.')) {
                    return Promise.reject('Only enter whole numbers, do not enter decimal values');
                  }
                  const buyingPrice = getFieldValue('buying_price');
                  if (!buyingPrice) return Promise.reject('Please enter buying price first');
                  if (parseFloat(value) <= parseFloat(buyingPrice)) {
                    return Promise.reject('Selling price must be greater than buying price');
                  }
                  return Promise.resolve();
                }
              })
            ]}
            help={form.getFieldValue('selling_price') <= form.getFieldValue('buying_price') ? 'Selling price must be greater than buying price' : null}
          >
            <div className="price-input-group" style={{
              display: "flex",
              height: "48px",
              backgroundColor: "#f8fafc",
              borderRadius: "10px",
              border: "1px solid #e6e8eb",
              overflow: "hidden",
              marginBottom: 0,
            }}>
              {/* <Select
                value={selectedCurrency?.id}
                size="large"
                style={{
                  width: "100px",
                  height: "48px",
                }}
                className="currency-select"
                disabled
              >
                <Option value={selectedCurrency?.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>{selectedCurrency?.currencyIcon || '₹'}</span>
                    <span>{selectedCurrency?.currencyCode || 'INR'}</span>
                  </div>
                </Option>
              </Select> */}
               <Form.Item name="currency" noStyle>
                <div style={{
                  width: "100px",
                  height: "48px",
                  background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "10px 0 0 10px",
                  fontWeight: 500,
                }}>
                  <span>{selectedCurrency?.currencyIcon || '₹'}</span>
                  <span style={{ marginLeft: '4px' }}>{selectedCurrency?.currencyCode || 'INR'}</span>
                </div>
              </Form.Item>
              <InputNumber
                placeholder="Enter selling price"
                size="large"
                style={{
                  flex: 1,
                  width: "100%",
                  border: "none",
                  borderLeft: "1px solid #e6e8eb",
                  borderRadius: 0,
                  height: "48px",
                  padding: "0 16px",
                }}
                min={1}
                className="price-input"
                parser={value => {
                  const parsedValue = parseFloat(value);
                  if (isNaN(parsedValue)) return '';
                  if (value && value.toString().includes('.')) {
                    message.warning("Only enter whole numbers, do not enter decimal values");
                    // Keep the decimal value visible but show warning
                    return parsedValue;
                  }
                  return parsedValue;
                }}
                onChange={handleSellingPriceChange}
              />
            </div>
          </Form.Item>

          <Form.Item
            name="hsn_sac"
            label={
              <span style={{ color: "#374151", fontWeight: 500 }}>
                HSN/SAC Code <span style={{ color: "#ff4d4f" }}>*</span>
              </span>
            }
            rules={[{ required: true, message: "Please enter HSN/SAC code" }]}
          >
            <Input placeholder="Enter HSN/SAC code" style={{ width: "100%",height:"48px" }} />
          </Form.Item>
          
          <Form.Item
            name="tax_name"
            label={
              <span style={{ color: "#374151", fontWeight: 500 }}>
                Tax Name
              </span>
            }
          >
            <Input placeholder="Enter tax name (e.g. GST, VAT)" style={{ width: "100%",height:"48px" }} />
          </Form.Item>
          
          <Form.Item
            name="tax_percentage"
            label={
              <span style={{ color: "#374151", fontWeight: 500 }}>
                Tax Percentage
              </span>
            }
            rules={[
              {
                validator: (_, value) => {
                  if (value && value < 0) {
                    return Promise.reject('Tax percentage cannot be negative');
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber
              placeholder="Enter tax percentage"
              min={0}
              max={100}
              addonAfter="%"
              style={{ width: "100%",height:"48px" }}
            />
          </Form.Item>
          
          <Form.Item
            name="sku"
            label={
              <span style={{ color: "#374151", fontWeight: 500 }}>SKU <span style={{ color: "#ff4d4f" }}>*</span></span>
            }
            rules={[{ required: true, message: "Please enter SKU" }]}
          >
            <Input placeholder="Enter SKU" style={{ width: "100%",height:"48px" }} />
          </Form.Item>
        </div>

        <Divider />

        {/* Stock Management */}
        <div className="section-title" style={{ marginBottom: "16px" }}>
          <Text strong style={{ fontSize: "16px", color: "#1f2937" }}>
            Stock Management
          </Text>
        </div>
        <div
          className="form-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          <Form.Item
            name="stock_status"
            label={
              <span style={{ color: "#374151", fontWeight: 500 }}>
                Stock Status <span style={{ color: "#ff4d4f" }}>*</span>
              </span>
            }
            rules={[{ required: true, message: "Please select stock status" }]}
          >
            <Select
              placeholder="Select status"
              className="stock-status-select"
              suffixIcon={<FiChevronDown />}
              style={{
                width: "100%",
                height: "48px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                backgroundColor: "#f9fafb",
              }}
            >
              {stockStatusOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {option.icon}
                    <span>{option.label}</span>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="stock_quantity"
            label={
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <span style={{ color: "#374151", fontWeight: 500 }}>
                  Stock Quantity <span style={{ color: "#ff4d4f" }}>*</span>
                </span>
              </div>
            }
            rules={ validateStockQuantities.stock_quantity}
          >
            <InputNumber
              placeholder="Enter quantity"
              min={0}
              onChange={() =>
                form.validateFields([
                  "min_stock_level",
                  "max_stock_level",
                  "reorder_quantity",
                ])
              }
              style={{
                width: "100%",
                height: "48px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                backgroundColor: "#f9fafb",
              }}
              parser={value => {
                const parsedValue = parseFloat(value);
                if (isNaN(parsedValue)) return '';
                if (value && value.toString().includes('.')) {
                  message.warning("Only enter whole numbers, do not enter decimal values");
                  // Keep decimal values visible but show warning
                  return parsedValue;
                }
                return parsedValue;
              }}
              prefix={
                <FiPackage style={{ color: "#6b7280", marginRight: "8px" }} />
              }
            />
          </Form.Item>

          <Form.Item
            name="min_stock_level"
            label={
              <span style={{ color: "#374151", fontWeight: 500 }}>
                Minimum Stock Level <span style={{ color: "#ff4d4f" }}>*</span>
              </span>
            }
            rules={validateStockQuantities.min_stock_level}
          >
            <InputNumber
              placeholder="Enter minimum stock level"
              min={0}
              onChange={() =>
                form.validateFields(["stock_quantity", "reorder_quantity"])
              }
              style={{
                width: "100%",
                height: "48px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                backgroundColor: "#f9fafb",
              }}
              parser={value => {
                const parsedValue = parseFloat(value);
                if (isNaN(parsedValue)) return '';
                if (value && value.toString().includes('.')) {
                  message.warning("Only enter whole numbers, do not enter decimal values");
                  // Keep decimal values visible but show warning
                  return parsedValue;
                }
                return parsedValue;
              }}
              prefix={
                <FiAlertCircle
                  style={{ color: "#6b7280", marginRight: "8px" }}
                />
              }
            />
          </Form.Item>

          <Form.Item
            name="max_stock_level"
            label={
              <span style={{ color: "#374151", fontWeight: 500 }}>
                Maximum Stock Level <span style={{ color: "#ff4d4f" }}>*</span>
              </span>
            }
            rules={validateStockQuantities.max_stock_level}
          >
            <InputNumber
              placeholder="Enter maximum stock level"
              min={0}
              onChange={() => form.validateFields(["stock_quantity"])}
              style={{
                width: "100%",
                height: "48px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                backgroundColor: "#f9fafb",
              }}
              parser={value => {
                const parsedValue = parseFloat(value);
                if (isNaN(parsedValue)) return '';
                if (value && value.toString().includes('.')) {
                  message.warning("Only enter whole numbers, do not enter decimal values");
                  // Keep decimal values visible but show warning
                  return parsedValue;
                }
                return parsedValue;
              }}
              prefix={
                <FiTrendingUp
                  style={{ color: "#6b7280", marginRight: "8px" }}
                />
              }
            />
          </Form.Item>

          <Form.Item
            name="reorder_quantity"
            label={
              <span style={{ color: "#374151", fontWeight: 500 }}>
                Reorder Quantity <span style={{ color: "#ff4d4f" }}>*</span>
              </span>
            }
            rules={validateStockQuantities.reorder_quantity}
          >
            <InputNumber
              placeholder="Enter reorder quantity"
              min={0}
              onChange={() => form.validateFields(["min_stock_level"])}
              style={{
                width: "100%",
                height: "48px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                backgroundColor: "#f9fafb",
              }}
              parser={value => {
                const parsedValue = parseFloat(value);
                if (isNaN(parsedValue)) return '';
                if (value && value.toString().includes('.')) {
                  message.warning("Only enter whole numbers, do not enter decimal values");
                  // Keep decimal values visible but show warning
                  return parsedValue;
                }
                return parsedValue;
              }}
              prefix={
                <FiInfo style={{ color: "#6b7280", marginRight: "8px" }} />
              }
            />
          </Form.Item>
        </div>

        <Divider />

        {/* Additional Information */}
        <div className="section-title" style={{ marginBottom: "16px" }}>
          <Text strong style={{ fontSize: "16px", color: "#1f2937" }}>
            Additional Information
          </Text>
        </div>
        <Form.Item
          name="description"
          label={
            <span style={{ color: "#374151", fontWeight: 500 }}>
              Description <span style={{ color: "#ff4d4f" }}>*</span>
            </span>
          }
          rules={[{ required: true, message: "Please enter product description" }]}
        >
          <TextArea
            placeholder="Enter product description"
            rows={4}
            style={{ borderRadius: "10px" }}
          />
        </Form.Item>

        <Form.Item
          name="image"
          label={
            <span style={{ color: "#374151", fontWeight: 500 }}>
              Product Image 
            </span>
          }
        >
          <Upload {...uploadProps}>
            <Button icon={<FiUpload />}>Click to upload</Button>
          </Upload>
        </Form.Item>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "16px",
            marginTop: "24px",
          }}
        >
          <Button onClick={handleCancel}>Cancel</Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
           
          >
            Create Product
          </Button>
        </div>
      </Form>

      <AddCategoryModal
        visible={addCategoryVisible}
        onCancel={() => setAddCategoryVisible(false)}
      />

      <style jsx>{`
        .currency-select .ant-select-selector {
          background: linear-gradient(
            135deg,
            #1890ff 0%,
            #096dd9 100%
          ) !important;
          border: none !important;
          color: white !important;
          height: 48px !important;
          line-height: 46px !important;
          padding: 0 12px !important;
          display: flex;
          align-items: center;
          box-shadow: none !important;
        }

        .currency-select .ant-select-selection-item {
          color: white !important;
          font-weight: 500 !important;
          display: flex;
          align-items: center;
          gap: 4px;
          height: 46px !important;
          line-height: 46px !important;
          font-size: 14px;
        }

        .currency-select .ant-select-arrow {
          color: white !important;
        }

        .currency-select .ant-select-clear {
          background: transparent !important;
          color: white !important;
          opacity: 0.8;
        }

        .currency-select .ant-select-clear:hover {
          opacity: 1;
        }

        .currency-select.ant-select-status-error:not(.ant-select-disabled):not(
            .ant-select-customize-input
          )
          .ant-select-selector {
          border-color: rgba(255, 255, 255, 0.3) !important;
        }

        .currency-select.ant-select-status-error .ant-select-arrow {
          color: white !important;
        }

        .currency-select .ant-select-selection-search-input {
          color: white !important;
        }

        .currency-select .ant-select-selection-placeholder {
          color: rgba(255, 255, 255, 0.8) !important;
        }

        .currency-select .ant-select-dropdown {
          padding: 8px !important;
        }

        .currency-select .ant-select-item {
          padding: 8px 12px !important;
          border-radius: 6px !important;
        }

        .currency-select .ant-select-item-option-content {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
        }

        .currency-select .ant-select-item-option-selected {
          background-color: #e6f4ff !important;
          font-weight: 500 !important;
        }

        .price-input-group {
          margin-bottom: 0 !important;
          display: flex !important;
          width: 100% !important;

          .ant-select-selector,
          .ant-input-number {
            height: 46px !important;
            line-height: 46px !important;
          }

          .ant-select-selector {
            border: none !important;
            background: linear-gradient(
              135deg,
              #1890ff 0%,
              #096dd9 100%
            ) !important;
            color: white !important;
            padding: 0 16px !important;
            display: flex;
            align-items: center;
            box-shadow: none !important;
            height: 46px !important;
          }

          .ant-select-selection-item {
            color: white !important;
            font-weight: 500 !important;
            display: flex;
            align-items: center;
            height: 46px !important;
            line-height: 46px !important;
          }

          .price-input {
            flex: 1 !important;
            width: calc(100% - 100px) !important;
          }

          .ant-input-number {
            background-color: transparent;
            height: 46px !important;

            &:hover,
            &:focus {
              border-color: transparent !important;
              box-shadow: none !important;
            }

            .ant-input-number-input-wrap {
              height: 46px !important;
              margin: 0 !important;
              padding: 0 !important;

              input {
                height: 46px !important;
                font-size: 14px;
                padding: 0 16px;
                line-height: 46px !important;
              }
            }

            .ant-input-number-handler-wrap {
              display: none;
            }
          }

          &:hover {
            border-color: #1890ff;

            .ant-select-selector {
              background: linear-gradient(
                135deg,
                #40a9ff 0%,
                #1890ff 100%
              ) !important;
            }
          }

          &:focus-within {
            border-color: #1890ff;
            box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
          }
        }

        .ant-form-item-required::before {
          display: none !important;
        }
        
        .ant-form-item-required::after {
          display: inline-block;
          margin-left: 4px;
          color: #ff4d4f;
          font-size: 14px;
          font-family: SimSun, sans-serif;
          line-height: 1;
          content: '*';
        }
      `}</style>
    </Modal>
  );
};

export default CreateProduct;

import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Tag,
  Dropdown,
  Tooltip,
  Typography,
  Modal,
  message,
  Input,
  Space,
  Menu,
  Avatar,
} from "antd";
import {
  FiEdit2,
  FiTrash2,
  FiEye,
  FiMoreVertical,
  FiMail,
  FiPhone,
  FiUser,
  FiUsers,
  FiMapPin,
  FiDollarSign,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  useGetCustomersQuery,
  useDeleteCustomerMutation,
} from "./services/custApi";
import "./customer.scss";

const { Text } = Typography;

const CustomerList = ({
  onEdit,
  onDelete,
  onView,
  onCustomerClick,
  onCustomerRevenueClick,
  custdata,
  searchText = "",
  pagination,
  onChange
}) => {
  const navigate = useNavigate();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const customers = custdata?.data;
  const [deleteCustomer] = useDeleteCustomerMutation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleDelete = (recordOrIds) => {
    const isMultiple = Array.isArray(recordOrIds);
    const title = isMultiple ? 'Delete Customers' : 'Delete Customer';
    const content = isMultiple
      ? `Are you sure you want to delete ${recordOrIds.length} selected customers? This action cannot be undone.`
      : 'Are you sure you want to delete this customer?';

    Modal.confirm({
      title,
      content,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      bodyStyle: { padding: "20px" },
      onOk: async () => {
        try {
          if (isMultiple) {
            await Promise.all(recordOrIds.map(id => deleteCustomer(id).unwrap()));
            message.success(`${recordOrIds.length} customers deleted successfully`);
            setSelectedRowKeys([]);
          } else {
            await deleteCustomer(recordOrIds).unwrap();
            message.success('Customer deleted successfully');
          }
        } catch (error) {
          message.error(error?.data?.message || 'Failed to delete customer(s)');
        }
      },
    });
  };

  const handleRowClick = (record, event) => {
    // Check if the click is from action buttons
    if (event.target.closest('.action-button') || event.target.closest('.ant-dropdown')) {
      return;
    }
    navigate('/dashboard/sales/revenue', {
      state: { selectedCustomer: record }
    });
  };

  const getActionItems = (record) => [
    {
      key: 'edit',
      icon: <FiEdit2 style={{ fontSize: '16px' }} />,
      label: 'Edit',
      onClick: () => onEdit(record)
    },
    {
      key: 'delete',
      icon: <FiTrash2 style={{ fontSize: '16px', color: '#ff4d4f' }} />,
      label: 'Delete',
      danger: true,
      onClick: () => handleDelete(record.id)
    }
  ];

  const filteredCustomers = React.useMemo(() => {
    return customers?.filter((customer) => {
      const searchLower = searchText.toLowerCase();
      const name = customer?.name?.toLowerCase() || "";
      const email = customer?.email?.toLowerCase() || "";
      const company = customer?.company?.toLowerCase() || "";
      const phone = customer?.phone?.toLowerCase() || "";

      return (
        !searchText ||
        name.includes(searchLower) ||
        email.includes(searchLower) ||
        company.includes(searchLower) ||
        phone.includes(searchLower)
      );
    });
  }, [customers, searchText]);

  const columns = [
    {
      title: "Customer Details",
      key: "name",
      // width: 200,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search customer name/number"
            value={selectedKeys[0]}
            onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90 }}>Filter</Button>
            <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>Reset</Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        const searchValue = value.toLowerCase();
        return (
          record.name?.toLowerCase().includes(searchValue) ||
          record.customerNumber?.toLowerCase().includes(searchValue) ||
          record.tax_number?.toLowerCase().includes(searchValue)
        );
      },
      render: (_, record) => (
        <div className="item-wrapper" onClick={(event) => handleRowClick(record, event)} style={{ cursor: 'pointer' }}>
          <div className="item-content">
            <div className="icon-wrapper customer-icon">
              {record.avatar ? (
                <Avatar src={record.avatar} size={40} />
              ) : (
                <FiUser className="item-icon" />
              )}
            </div>
            <div className="info-wrapper">
              <div className="name">{record.name}</div>
              <div className="meta">
                <Text type="secondary">{record.customerNumber}</Text>
                {record.tax_number && (
                  <Tag style={{ marginLeft: 8 }}>TAX: {record.tax_number}</Tag>
                )}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Contact Info",
      key: "contact",
      // width: 150,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search email or phone"
            value={selectedKeys[0]}
            onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90 }}>Filter</Button>
            <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>Reset</Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        const searchValue = value.toLowerCase();
        return (
          record.email?.toLowerCase().includes(searchValue) ||
          record.contact?.toLowerCase().includes(searchValue)
        );
      },
      render: (_, record) => (
        <div className="item-wrapper">
          <div className="item-content">
            <div className="icon-wrapper contact-icon">
              <FiMail className="item-icon" />
            </div>
            <div className="info-wrapper">
              <div className="main-info">
                <Text copyable>{record.email}</Text>
              </div>
              <Text type="secondary" className="sub-info">
                <FiPhone style={{ marginRight: 4 }} /> {record.contact}
              </Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Billing Address",
      key: "billing",
      // width: 300,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search city, state or country"
            value={selectedKeys[0]}
            onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90 }}>Filter</Button>
            <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>Reset</Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        const searchValue = value.toLowerCase();
        
        // Safely handle billing_address parsing
        let billing = {};
        if (record.billing_address) {
          if (typeof record.billing_address === 'string') {
            try {
              billing = JSON.parse(record.billing_address);
            } catch (error) {
              console.error('Error parsing billing address:', error);
            }
          } else if (typeof record.billing_address === 'object') {
            billing = record.billing_address;
          }
        }
        
        return (
          billing.city?.toLowerCase().includes(searchValue) ||
          billing.state?.toLowerCase().includes(searchValue) ||
          billing.country?.toLowerCase().includes(searchValue) ||
          billing.postal_code?.toLowerCase().includes(searchValue)
        );
      },
      render: (_, record) => {
        // Safely handle billing_address parsing
        let billing = {};
        if (record.billing_address) {
          if (typeof record.billing_address === 'string') {
            try {
              billing = JSON.parse(record.billing_address);
            } catch (error) {
              console.error('Error parsing billing address:', error);
            }
          } else if (typeof record.billing_address === 'object') {
            billing = record.billing_address;
          }
        }
        
        return (
          <div className="item-wrapper">
            <div className="item-content">
              <div className="icon-wrapper location-icon">
                <FiMapPin className="item-icon" />
              </div>
              <div className="info-wrapper">
                <div className="name">{billing.city || 'N/A'}</div>
                <div className="meta">
                  {[billing.street, billing.state, billing.country]
                    .filter(Boolean)
                    .join(', ')}
                </div>
                {billing.postal_code && (
                  <Text type="secondary" className="sub-info">
                    PIN: {billing.postal_code}
                  </Text>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Created Info",
      key: "created",
      // width: 150,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search creator name"
            value={selectedKeys[0]}
            onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90 }}>Filter</Button>
            <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>Reset</Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        const searchValue = value.toLowerCase();
        return record.created_by?.toLowerCase().includes(searchValue);
      },
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      render: (_, record) => (
        <div className="item-wrapper">
          <div className="item-content">
            <div className="info-wrapper">
              <div className="name">
                <Text>{record.created_by || 'N/A'}</Text>
              </div>
              <div className="meta">
                {dayjs(record.createdAt).format('DD MMM YYYY')}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Dropdown
          overlay={
            <Menu>
              {getActionItems(record).map(item => (
                <Menu.Item key={item.key} icon={item.icon} onClick={item.onClick} danger={item.danger}>
                  {item.label}
                </Menu.Item>
              ))}
            </Menu>
          }
          trigger={['click']}
        >
          <Button
            type="text"
            icon={<FiMoreVertical size={16} />}
            className="action-button"
          />
        </Dropdown>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  // Remove the local paginationConfig and use the server-side pagination
  const paginationConfig = {
    ...pagination,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `Total ${total} customers`,
    pageSizeOptions: isMobile ? ["5", "10", "15", "20", "25"] : ["10", "20", "50", "100"],
    locale: {
      items_per_page: isMobile ? "" : "/ page",
    }
  };

  return (
    <div className="customer-list-container">
      {selectedRowKeys.length > 0 && (
        <div className="bulk-actions">
          <Button
            type="primary"
            danger
            icon={<FiTrash2 />}
            onClick={() => handleDelete(selectedRowKeys)}
          >
            Delete Selected ({selectedRowKeys.length})
          </Button>
        </div>
      )}

      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={filteredCustomers}
        rowKey="id"
        // className="custom-table"
        pagination={paginationConfig}
        onChange={onChange}
        scroll={{ x: "max-content", y: '' }}
        onRow={(record) => ({
          onClick: (event) => handleRowClick(record, event),
          style: { cursor: 'pointer' }
        })}
      />
    </div>
  );
};

export default CustomerList;

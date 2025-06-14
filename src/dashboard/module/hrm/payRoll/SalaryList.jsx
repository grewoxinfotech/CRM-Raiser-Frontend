import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Table, Button, Tag, Dropdown, Typography, Modal, message, Input, Space, Switch, Avatar, DatePicker } from "antd";
import {
  FiEdit2,
  FiTrash2,
  FiEye,
  FiMoreVertical,
  FiDollarSign,
  FiFileText,
  FiCalendar,
  FiUser
} from "react-icons/fi";
import dayjs from "dayjs";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  useGetSalaryQuery,
  useDeleteSalaryMutation,
  useUpdateSalaryMutation,
} from "./services/salaryApi";
import { useGetEmployeesQuery } from "../Employee/services/employeeApi";
import { useGetAllCurrenciesQuery } from "../../settings/services/settingsApi";
import EditSalary from "./EditSalary";

const { Text } = Typography;

const switchStyles = `
  .status-switch.ant-switch {
    min-width: 40px;
    height: 22px;
    background: #faad14;
    padding: 0 2px;
  }

  .status-switch.ant-switch .ant-switch-handle {
    width: 18px;
    height: 18px;
    top: 2px;
    left: 2px;
    transition: all 0.2s ease-in-out;
  }

  .status-switch.ant-switch.ant-switch-checked .ant-switch-handle {
    left: calc(100% - 20px);
  }

  .status-switch.ant-switch.paid {
    background: #52c41a;
  }

  .status-switch.ant-switch:not(.ant-switch-disabled) {
    background-color: #faad14;
  }

  .status-switch.ant-switch.paid:not(.ant-switch-disabled) {
    background: #52c41a;
  }

  .status-switch.ant-switch:focus {
    box-shadow: none;
  }

  .status-switch.ant-switch .ant-switch-handle::before {
    background-color: #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
`;

const SalaryList = ({ onEdit, onView, searchText = "", pagination }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Updated query to include search
  const { data: salarydata = [], isLoading } = useGetSalaryQuery({
    page: pagination?.current || 1,
    pageSize: pagination?.pageSize || 10,
    search: searchText.trim()
  });

  const salary = salarydata?.data || [];
  const { data: employeesData } = useGetEmployeesQuery();
  const { data: currenciesData } = useGetAllCurrenciesQuery();
  const [deleteSalary] = useDeleteSalaryMutation();
  const [updateSalary] = useUpdateSalaryMutation();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [processingSalaryId, setProcessingSalaryId] = useState(null);
  const [processedSalary, setProcessedSalary] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Define status options
  const statusOptions = [
    { text: 'Paid', value: 'paid' },
    { text: 'Unpaid', value: 'unpaid' },
  ];

  // Create a map of employee IDs to employee names with null check
  const employeeMap = useMemo(() => {
    if (!employeesData?.data) return {};
    return employeesData.data.reduce((acc, employee) => {
      acc[employee.id] = `${employee.firstName} ${employee.lastName}`;
      return acc;
    }, {});
  }, [employeesData]);

  // Create a map of currency IDs to currency details with null check
  const currencyMap = useMemo(() => {
    if (!currenciesData?.data) return {};
    return currenciesData.data.reduce((acc, currency) => {
      acc[currency.id] = {
        name: currency.currencyName,
        code: currency.currencyCode,
        icon: currency.currencyIcon
      };
      return acc;
    }, {});
  }, [currenciesData]);

  const getEmployeeDetails = useCallback((employeeId) => {
    if (!employeesData?.data) return {};
    return employeesData.data.find(emp => emp.id === employeeId) || {};
  }, [employeesData]);

  const getCurrencyIcon = (currencyId) => {
    const currency = currenciesData?.find(curr => curr.id === currencyId);
    return currency?.currencyIcon || '₹';
  };

  const handleDelete = (recordOrIds) => {
    const isMultiple = Array.isArray(recordOrIds);
    const title = isMultiple ? 'Delete Selected Salaries' : 'Delete Salary';
    const content = isMultiple
      ? `Are you sure you want to delete ${recordOrIds.length} selected salary records?`
      : 'Are you sure you want to delete this salary record?';

    Modal.confirm({
      title,
      content,
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      bodyStyle: { padding: "20px" },
      onOk: async () => {
        try {
          if (isMultiple) {
            await Promise.all(recordOrIds.map(id => deleteSalary(id).unwrap()));
            message.success(`${recordOrIds.length} salaries deleted successfully`);
            setSelectedRowKeys([]); // Clear selection after successful delete
          } else {
            await deleteSalary(recordOrIds).unwrap();
            message.success('Salary deleted successfully');
          }
        } catch (error) {
          message.error(error?.data?.message || 'Failed to delete salary(s)');
        }
      },
    });
  };

  const handleEdit = (record) => {
    setSelectedSalary({
      ...record,
      salary_date: record.salary_date ? dayjs(record.salary_date) : null,
      payment_date: record.payment_date ? dayjs(record.payment_date) : null,
    });
    setEditModalVisible(true);
  };

  const handleEditModalClose = () => {
    setEditModalVisible(false);
    setSelectedSalary(null);
  };

  const handleSalaryAction = async (id, status, employeeId) => {
    setProcessingSalaryId(id);
    try {
      await updateSalary({
        id,
        data: {
          status,
          employeeId,
          remarks:
            status === "approved" ? "Salary approved." : "Salary rejected.",
        },
      }).unwrap();
      setProcessedSalary((prev) => new Set([...prev, id]));
      message.success(
        `Salary ${status === "approved" ? "approved" : "rejected"} successfully`
      );
    } catch (error) {
      message.error(error?.data?.message || `Failed to ${status} salary`);
    } finally {
      setProcessingSalaryId(null);
    }
  };

  const generatePayslip = (record) => {
    try {
      const doc = new jsPDF();
      const employeeName = employeeMap[record.employeeId] || "Unknown Employee";
      // const currencyIcon = getCurrencyIcon(record.currency);

      // Add Header
      doc.setFillColor(41, 128, 185);
      doc.rect(0, 0, doc.internal.pageSize.width, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text('PAYSLIP', 105, 20, { align: 'center' });

      // Reset color
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);

      // Employee Details
      doc.setFillColor(240, 240, 240);
      doc.rect(10, 40, doc.internal.pageSize.width - 20, 35, 'F');

      doc.setFont(undefined, 'bold');
      doc.text('Employee Details:', 20, 50);
      doc.setFont(undefined, 'normal');
      doc.text(`Name: ${employeeName}`, 20, 60);
      doc.text(`Date: ${dayjs(record.paymentDate).format('DD-MM-YYYY')}`, 20, 70);
      doc.text(`Bank Account: ${record.bankAccount || 'N/A'}`, 120, 60);
      doc.text(`Type: ${record.payslipType}`, 120, 70);

      // Create salary table
      const tableData = [
        [{ content: 'Salary Details', colSpan: 2, styles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], halign: 'center' } }],
        ['Basic Salary', ` ${Number(record.salary || 0).toFixed(2)}`],
        ['Allowances', ` ${Number(record.allowances || 0).toFixed(2)}`],
        ['Deductions', ` ${Number(record.deductions || 0).toFixed(2)}`],
        [{ content: 'Net Salary', styles: { fontStyle: 'bold' } },
        { content: ` ${Number(record.netSalary || 0).toFixed(2)}`, styles: { fontStyle: 'bold' } }]
      ];

      doc.autoTable({
        startY: 85,
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 6,
        },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 80, halign: 'center' }
        },
        margin: { left: 20, right: 20 }
      });


      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.text('This is a computer-generated document.', 105, pageHeight - 10, { align: 'center' });

      // Save PDF
      doc.save(`Payslip-${employeeName}-${dayjs(record.paymentDate).format('MMM-YYYY')}.pdf`);
      message.success('Payslip generated successfully!');
    } catch (error) {
      console.error('Error generating payslip:', error);
      message.error('Failed to generate payslip');
    }
  };

  const handleStatusChange = async (checked, record) => {
    try {
      setLoading(true);
      const response = await updateSalary({
        id: record.id,
        data: {
          ...record,
          status: checked ? 'paid' : 'unpaid',
          salary: record.salary.toString(),
          netSalary: record.netSalary.toString()
        }
      }).unwrap();

      if (response.success) {
        message.success(`Payment status updated to ${checked ? 'paid' : 'unpaid'}`);
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      message.error(error?.data?.message || 'Failed to update payment status');
    } finally {
      setLoading(false);
    }
  };

  const getDropdownItems = (record) => ({
    items: [
      // {
      //   key: "view",
      //   icon: <FiEye />,
      //   label: "View Details",
      //   onClick: () => onView?.(record),
      // },
      {
        key: "generatePayslip",
        icon: <FiFileText />,
        label: "Generate Payslip",
        onClick: () => generatePayslip(record),
      },
      {
        key: "edit",
        icon: <FiEdit2 />,
        label: "Edit",
        onClick: () => handleEdit(record),
      },
      {
        key: "delete",
        icon: <FiTrash2 />,
        label: "Delete",
        onClick: () => handleDelete(record.id),
        danger: true,
      },
    ],
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "success";
      case "pending":
        return "warning";
      case "rejected":
        return "error";
      default:
        return "default";
    }
  };

  const columns = [
    {
      title: "Employee Name",
      dataIndex: "employeeId",
      key: "employeeId",
      width: 200,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search employee name"
            value={selectedKeys[0]}
            onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90 }}
            >
              Filter
            </Button>
            <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
              Reset
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        const employee = getEmployeeDetails(record.employeeId);
        const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.toLowerCase();
        return fullName.includes(value.toLowerCase());
      },
      render: (employeeId) => {
        const employee = getEmployeeDetails(employeeId);
        return (
          <Space>
            <Avatar
              src={employee.profilePic}
              icon={!employee.profilePic && <FiUser />}
              style={{ backgroundColor: !employee.profilePic ? '#1890FF' : 'transparent' }}
            />
            <div>
              <div style={{ fontWeight: 500 }}>{`${employee.firstName || ''} ${employee.lastName || ''}`}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{employee.email || ''}</div>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Payment Date",
      dataIndex: "paymentDate",
      key: "paymentDate",
      width: 150,
      render: (date) => dayjs(date).format('DD-MM-YYYY'),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <DatePicker
            value={selectedKeys[0] ? dayjs(selectedKeys[0]) : null}
            onChange={(date) => {
              const dateStr = date ? date.format('YYYY-MM-DD') : null;
              setSelectedKeys(dateStr ? [dateStr] : []);
            }}
            style={{ marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90 }}
            >
              Filter
            </Button>
            <Button
              onClick={() => clearFilters()}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        if (!value || !record.paymentDate) return false;
        return dayjs(record.paymentDate).format('YYYY-MM-DD') === value;
      },
      filterIcon: filtered => (
        <FiCalendar style={{ color: filtered ? '#1890ff' : undefined }} />
      )
    },
    {
      title: "Payslip Type",
      dataIndex: "payslipType",
      key: "payslipType",
      width: 150,
      sorter: (a, b) =>
        (a?.payslipType || "").localeCompare(b?.payslipType || ""),
      render: (payslipType) => (
        <Tag
          color="blue"
          style={{ borderRadius: "4px", padding: "2px 8px", fontSize: "13px" }}
        >
          {payslipType}
        </Tag>
      ),
    },
    {
      title: "Bank Account",
      dataIndex: "bankAccount",
      key: "bankAccount",
      width: 150,
      sorter: (a, b) =>
        (a?.bankAccount || "").localeCompare(b?.bankAccount || ""),
      render: (bankAccount) => (
        <Text style={{ color: "#262626" }}>{bankAccount}</Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 150,
      filters: statusOptions,
      onFilter: (value, record) => record.status?.toLowerCase() === value.toLowerCase(),
      render: (status, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: '120px' }}>
            <span style={{ color: '#52c41a', fontSize: '14px' }}>₹</span>
            <span style={{ fontWeight: 500 }}>
              {Number(record.salary || 0).toLocaleString('en-IN', {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2
              })}
            </span>
            <span style={{ color: '#8c8c8c', fontSize: '13px', marginLeft: '2px' }}>INR</span>
          </div>
          <Switch
            size="small"
            checked={status === 'paid'}
            onChange={(checked) => handleStatusChange(checked, record)}
            // loading={loading}
            className={`status-switch ${status === 'paid' ? 'paid' : ''}`}
          />
          <Tag
            color={status === 'paid' ? 'success' : 'warning'}
            style={{
              margin: 0,
              textTransform: 'capitalize',
              borderRadius: '12px',
              fontSize: '12px',
              padding: '0 8px',
              height: '22px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {status}
          </Tag>
        </div>
      ),
    },
    {
      title: "Action",
      key: "actions",
      width: 80,
      fixed: "right",
      render: (_, record) => (
        <Dropdown
          menu={getDropdownItems(record)}
          trigger={["click"]}
          placement="bottomRight"
          overlayClassName="salary-actions-dropdown"
        >
          <Button
            type="text"
            icon={
              <FiMoreVertical style={{ fontSize: "18px", color: "#8c8c8c" }} />
            }
            className="action-dropdown-button"
            onClick={(e) => e.preventDefault()}
            style={{
              padding: "4px",
              borderRadius: "4px",
              "&:hover": {
                background: "#f5f5f5",
              },
            }}
          />
        </Dropdown>
      ),
    },
  ];

  // Add this useEffect for styles
  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = switchStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Bulk actions component
  const BulkActions = () => (
    <div className={`bulk-actions ${selectedRowKeys.length > 0 ? 'active' : ''}`}>
      {selectedRowKeys.length > 0 && (
        <Button
          type="primary"
          danger
          icon={<FiTrash2 />}
          onClick={() => handleDelete(selectedRowKeys)}
        >
          Delete Selected ({selectedRowKeys.length})
        </Button>
      )}
    </div>
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="salary-list-container">
      <BulkActions />
      <Table
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys,
          onChange: (newSelectedRowKeys) => {
            setSelectedRowKeys(newSelectedRowKeys);
          },
        }}
        columns={columns}
        dataSource={salary}
        rowKey="id"
        loading={isLoading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
          pageSizeOptions: ['10', '20', '50', '100'],
          onChange: (page, pageSize) => {
            pagination?.onChange?.(page);
            if (pageSize !== pagination?.pageSize) {
              pagination?.onSizeChange?.(pageSize);
            }
          }
        }}
        // className="custom-table"
        scroll={{ x: 'max-content', y: '100%' }}
        size="middle"
        style={{
          background: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        }}
      />
      {selectedSalary && (
        <EditSalary
          open={editModalVisible}
          onCancel={handleEditModalClose}
          initialValues={selectedSalary}
        />
      )}
    </div>
  );
};

export default SalaryList;

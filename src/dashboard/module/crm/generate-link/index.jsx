import React, { useState, useCallback } from "react";
import {
    Card,
    Typography,
    Button,
    Modal,
    message,
    Input,
    Dropdown,
    Menu,
    Breadcrumb,
    Space,
    Popconfirm,
    Popover,
} from "antd";
import {
    FiPlus,
    FiSearch,
    FiDownload,
    FiHome,
    FiChevronDown,
    FiEdit2,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import moment from "moment";
import CustomFormList from "./CustomFormList";
import CreateCustomForm from "./CreateCustomForm";
import EditCustomForm from "./EditCustomForm";
import GenerateLinkModal from "./GenerateLinkModal";
import {
    useGetCustomFormsQuery,
    useCreateCustomFormMutation,
    useUpdateCustomFormMutation,
    useDeleteCustomFormMutation,
} from "./services/customFormApi";
import "./CustomForm.scss";
import { FileTextOutlined, DeleteOutlined } from '@ant-design/icons';
import FormSubmitted from './FormSubmitted';

const { Title, Text } = Typography;

const CustomFormPage = () => {
    const [searchText, setSearchText] = useState("");
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [generateLinkModalVisible, setGenerateLinkModalVisible] = useState(false);
    const [selectedForm, setSelectedForm] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const navigate = useNavigate();

    const {
        data: formsData,
        isLoading,
        error,
        refetch
    } = useGetCustomFormsQuery();

    const [createForm] = useCreateCustomFormMutation();
    const [updateForm] = useUpdateCustomFormMutation();
    const [deleteForm] = useDeleteCustomFormMutation();

    // Ensure we have an array of forms
    const forms = Array.isArray(formsData?.data) ? formsData.data : [];

    // Show error message if API call fails
    React.useEffect(() => {
        if (error) {
            message.error(error?.data?.message || "Failed to fetch custom forms");
        }
    }, [error]);

    const handleCreate = async (values) => {
        try {
            await createForm(values).unwrap();
            message.success("Custom form created successfully");
            setCreateModalVisible(false);
            refetch(); // Refresh the list after creating
        } catch (error) {
            message.error(error?.data?.message || "Failed to create custom form");
        }
    };

    const handleEditClick = useCallback((record) => {
        setSelectedForm(record);
        setIsEditModalOpen(true);
    }, []);

    const handleEditCancel = useCallback(() => {
        setIsEditModalOpen(false);
    }, []);

    const handleEditSubmit = useCallback(async (values) => {
        try {
            const { id, ...data } = values;
            await updateForm({ id, data }).unwrap();
            message.success('Form updated successfully');
            setIsEditModalOpen(false);
        } catch (error) {
            console.error('Update error:', error);
            message.error(error?.data?.message || 'Failed to update form');
        }
    }, [updateForm]);

    const handleGenerateLink = (record) => {
        setSelectedForm(record);
        setGenerateLinkModalVisible(true);
    };

    const handleDelete = (record) => {
        console.log('Delete handler received record:', record); // Debug log

        // Check the complete record structure
        if (!record) {
            message.error("No record provided");
            return;
        }

        // Get the ID from either _id or id field
        const recordId = record._id || record.id;
        console.log('Record ID:', recordId); // Debug log

        if (!recordId) {
            message.error("No ID found in record");
            return;
        }

        Modal.confirm({
            title: "Delete Custom Form",
            content: "Are you sure you want to delete this form?",
            okText: "Yes",
            okType: "danger",
            cancelText: "No",
            onOk: async () => {
                try {
                    await deleteForm(recordId).unwrap();
                    message.success("Custom form deleted successfully");
                    refetch();
                } catch (error) {
                    console.error('Delete error:', error); // Debug log
                    message.error(error?.data?.message || "Failed to delete custom form");
                }
            },
        });
    };

    const handleBulkDelete = async (ids) => {
        try {
            // Use Promise.all to handle multiple deletions concurrently
            await Promise.all(ids.map(id => deleteForm(id).unwrap()));
            await refetch();
            return Promise.resolve();
        } catch (error) {
            console.error('Bulk delete error:', error);
            return Promise.reject(error);
        }
    };

    const handleExport = async (type) => {
        try {
            setLoading(true);
            const data = forms;

            if (data.length === 0) {
                message.warning("No data available to export");
                return;
            }

            switch (type) {
                case "csv":
                    exportToCSV(data, "custom_forms_export");
                    break;
                case "excel":
                    exportToExcel(data, "custom_forms_export");
                    break;
                case "pdf":
                    exportToPDF(data, "custom_forms_export");
                    break;
                default:
                    break;
            }
            message.success(`Successfully exported as ${type.toUpperCase()}`);
        } catch (error) {
            message.error(`Failed to export: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = (data, filename) => {
        if (data.length === 0) return;

        const csvContent = [
            Object.keys(data[0]).join(","),
            ...data.map((item) =>
                Object.values(item)
                    .map((value) => `"${value?.toString().replace(/"/g, '""')}"`)
                    .join(",")
            ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `${filename}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const exportToExcel = (data, filename) => {
        if (data.length === 0) return;

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Custom Forms");
        XLSX.writeFile(wb, `${filename}.xlsx`);
    };

    const exportToPDF = (data, filename) => {
        if (data.length === 0) return;

        const doc = new jsPDF("l", "pt", "a4");
        doc.autoTable({
            head: [Object.keys(data[0])],
            body: data.map((item) => Object.values(item)),
            margin: { top: 20 },
            styles: { fontSize: 8 },
        });
        doc.save(`${filename}.pdf`);
    };

    const exportMenu = (
        <Menu onClick={({ key }) => handleExport(key)}>
            <Menu.Item key="csv">Export as CSV</Menu.Item>
            <Menu.Item key="excel">Export as Excel</Menu.Item>
            <Menu.Item key="pdf">Export as PDF</Menu.Item>
        </Menu>
    );

    const columns = [
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<FileTextOutlined />}
                        onClick={() => navigate(`/dashboard/crm/custom-form/${record.id}/submissions`)}
                    >
                        View Submissions
                    </Button>
                    <Button
                        type="primary"
                        onClick={() => handleCopyLink(record.id)}
                    >
                        Copy Form Link
                    </Button>
                    <Popconfirm
                        title="Delete Form"
                        description="Are you sure you want to delete this form?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const routes = [
        // ... existing routes ...
        {
            path: '/form-submitted',
            element: <FormSubmitted />
        }
    ];

    return (
        <div className="custom-form-container">
            <div className="page-breadcrumb">
                <Breadcrumb>
                    <Breadcrumb.Item>
                        <Link to="/dashboard">
                            <FiHome style={{ marginRight: "4px" }} />
                            <span style={{ color: "#6b7280", fontWeight: "500" }}>Home</span>
                        </Link>
                    </Breadcrumb.Item>
                    {/* <Breadcrumb.Item>
                        <Link to="/dashboard/crm">CRM</Link>
                    </Breadcrumb.Item> */}
                    <Breadcrumb.Item style={{ color: "#1f2937", fontWeight: "500" }}>Custom Forms</Breadcrumb.Item>
                </Breadcrumb>
            </div>

            <div className="page-header">
                <div className="page-title">
                    <Title level={2}>Custom Forms</Title>
                    <Text type="secondary">Manage all custom forms in the organization</Text>
                </div>
                <div className="header-actions">
                    <div className="desktop-actions">
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div className="search-container">
                                <Input
                                    prefix={<FiSearch style={{ color: "#8c8c8c", fontSize: "16px" }} />}
                                    placeholder="Search forms..."
                                    allowClear
                                    onChange={(e) => setSearchText(e.target.value)}
                                    value={searchText}
                                    className="search-input"
                                />
                                <Popover
                                    content={
                                        <div className="search-popup">
                                            <Input
                                                prefix={<FiSearch style={{ color: "#8c8c8c" }} />}
                                                placeholder="Search forms..."
                                                allowClear
                                                onChange={(e) => setSearchText(e.target.value)}
                                                value={searchText}
                                                className="search-input"
                                                autoFocus
                                            />
                                        </div>
                                    }
                                    trigger="click"
                                    open={isSearchVisible}
                                    onOpenChange={setIsSearchVisible}
                                    placement="bottomRight"
                                    className="mobile-search-popover"
                                >
                                    <Button
                                        className="search-icon-button"
                                        icon={<FiSearch size={16} />}
                                    />
                                </Popover>
                            </div>
                            <Dropdown overlay={exportMenu} trigger={["click"]}>
                                <Button className="export-button">
                                    <FiDownload size={16} />
                                    <span className="button-text">Export</span>
                                </Button>
                            </Dropdown>
                            <Button
                                type="primary"
                                icon={<FiPlus size={16} />}
                                onClick={() => setCreateModalVisible(true)}
                                className="add-button"
                            >
                                <span className="button-text">New Form</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <Card className="content-card">
                <CustomFormList
                    data={forms}
                    loading={isLoading}
                    onEdit={handleEditClick}
                    onDelete={handleDelete}
                    onGenerateLink={handleGenerateLink}
                    onBulkDelete={handleBulkDelete}
                    searchText={searchText}
                />
            </Card>

            <CreateCustomForm
                open={createModalVisible}
                onCancel={() => setCreateModalVisible(false)}
                onSubmit={handleCreate}
                loading={loading}
                initialValues={selectedForm}
            />

            <EditCustomForm
                open={isEditModalOpen}
                onCancel={handleEditCancel}
                onSubmit={handleEditSubmit}
                loading={loading}
                initialValues={selectedForm}
            />

            <GenerateLinkModal
                open={generateLinkModalVisible}
                onCancel={() => {
                    setGenerateLinkModalVisible(false);
                    setSelectedForm(null);
                }}
                formData={selectedForm}
            />
        </div>
    );
};

export default CustomFormPage;

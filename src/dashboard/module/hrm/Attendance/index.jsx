import React, { useState } from 'react';
import {
    Card, Typography, Button, Input,
    Dropdown, Menu, Row, Col, Breadcrumb, Select, DatePicker, Popover
} from 'antd';
import {
    FiPlus, FiSearch, FiDownload,
    FiHome, FiCalendar, FiFilter,
    FiChevronDown
} from 'react-icons/fi';
import './attendance.scss';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import CreateAttendance from './CreateAttendance';
import AttendanceList from './AttendanceList';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const Attendance = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(dayjs());
    const [filters, setFilters] = useState({
        employee: undefined,
        status: undefined,
        dateRange: [],
    });
    const [showFilters, setShowFilters] = useState(false);
    const [isSearchVisible, setIsSearchVisible] = useState(false);

    // Status options for the filter
    const statusOptions = [
        { label: 'Present', value: 'P' },
        { label: 'Absent', value: 'A' },
        { label: 'Leave', value: 'L' },
        { label: 'Holiday', value: 'H' },
        { label: 'Weekend', value: 'WK' },
    ];

    const handleCreate = () => {
        setIsModalOpen(true);
    };

    const handleModalSubmit = () => {
        setIsModalOpen(false);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            employee: undefined,
            status: undefined,
            dateRange: [],
        });
        setSearchText('');
    };

    // Export functions
    const exportToExcel = (data) => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
        XLSX.writeFile(wb, 'attendance_export.xlsx');
    };

    const exportToPDF = (data) => {
        const doc = new jsPDF('l', 'pt', 'a4');
        doc.autoTable({
            head: [Object.keys(data[0])],
            body: data.map(item => Object.values(item)),
            margin: { top: 20 },
            styles: { fontSize: 8 }
        });
        doc.save('attendance_export.pdf');
    };

    const exportToCSV = (data) => {
        const csvContent = [
            Object.keys(data[0]).join(','),
            ...data.map(item => Object.values(item).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'attendance_export.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleExport = (type) => {
        // Mock data for export - replace with actual data
        const formattedData = [
            {
                'Employee': 'John Doe',
                'Date': '2024-01-01',
                'Status': 'Present',
                'Time In': '09:00',
                'Time Out': '18:00'
            }
        ];

        switch (type) {
            case 'excel':
                exportToExcel(formattedData);
                break;
            case 'pdf':
                exportToPDF(formattedData);
                break;
            case 'csv':
                exportToCSV(formattedData);
                break;
            default:
                break;
        }
    };

    const exportMenu = (
        <Menu>
            <Menu.Item key="excel" icon={<FiDownload />} onClick={() => handleExport('excel')}>
                Export as Excel
            </Menu.Item>
            <Menu.Item key="pdf" icon={<FiDownload />} onClick={() => handleExport('pdf')}>
                Export as PDF
            </Menu.Item>
            <Menu.Item key="csv" icon={<FiDownload />} onClick={() => handleExport('csv')}>
                Export as CSV
            </Menu.Item>
        </Menu>
    );

    const searchContent = (
        <div className="search-popup">
            <Input
                prefix={<FiSearch style={{ color: "#8c8c8c" }} />}
                placeholder="Search employee..."
                allowClear
                onChange={(e) => setSearchText(e.target.value)}
                value={searchText}
                className="search-input"
                autoFocus
            />
        </div>
    );

    return (
        <div className="attendance-page">
            <div className="page-breadcrumb">
                <Breadcrumb>
                    <Breadcrumb.Item>
                        <Link to="/dashboard">
                            <FiHome style={{ marginRight: '4px' }} />
                            Home
                        </Link>
                    </Breadcrumb.Item>
                    {/* <Breadcrumb.Item>
                        <Link to="/dashboard/hrm">HRM</Link>
                    </Breadcrumb.Item> */}
                    <Breadcrumb.Item>Attendance</Breadcrumb.Item>
                </Breadcrumb>
            </div>

            <div className="page-header">
                <div className="page-title">
                    <Title level={2}>Attendance</Title>
                    <Text type="secondary">Manage employee attendance records</Text>
                </div>
                <div className="header-actions">
                    <div className="desktop-actions">
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div className="search-container">
                                <Input
                                    prefix={<FiSearch style={{ color: "#8c8c8c", fontSize: "16px" }} />}
                                    placeholder="Search employee..."
                                    allowClear
                                    onChange={(e) => setSearchText(e.target.value)}
                                    value={searchText}
                                    className="search-input"
                                />
                                <Popover
                                    content={searchContent}
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
                            <Dropdown overlay={exportMenu} trigger={['click']}>
                                <Button className="export-button">
                                    <FiDownload size={16} />
                                    <span className="button-text">Export</span>
                                </Button>
                            </Dropdown>
                            <Button
                                type="primary"
                                icon={<FiPlus size={16} />}
                                onClick={handleCreate}
                                className="add-button"
                            >
                                <span className="button-text">Create Attendance</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {showFilters && (
                <Card className="filter-card" style={{ marginBottom: '1rem' }}>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={6}>
                            <Select
                                placeholder="Select Employee"
                                style={{ width: '100%' }}
                                allowClear
                                value={filters.employee}
                                onChange={(value) => handleFilterChange('employee', value)}
                            >
                                <Option value="1">John Doe</Option>
                                <Option value="2">Jane Smith</Option>
                            </Select>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Select
                                placeholder="Select Status"
                                style={{ width: '100%' }}
                                allowClear
                                mode="multiple"
                                value={filters.status}
                                onChange={(value) => handleFilterChange('status', value)}
                            >
                                {statusOptions.map(option => (
                                    <Option key={option.value} value={option.value}>
                                        {option.label}
                                    </Option>
                                ))}
                            </Select>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <RangePicker
                                style={{ width: '100%' }}
                                value={filters.dateRange}
                                onChange={(dates) => handleFilterChange('dateRange', dates)}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Button type="primary" onClick={clearFilters} block>
                                Clear Filters
                            </Button>
                        </Col>
                    </Row>
                </Card>
            )}

            <Card className="attendance-table-card">
                <AttendanceList
                    searchText={searchText}
                    filters={filters}
                    selectedMonth={selectedMonth}
                />
            </Card>

            <CreateAttendance
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
            />
        </div>
    );
};

export default Attendance;

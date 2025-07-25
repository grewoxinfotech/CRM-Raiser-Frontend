import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Input, Space, Typography } from 'antd';
import {
    FiUser,
    FiBriefcase,
    FiPhone,
    FiClock,
    FiHash,
    FiGlobe,
    FiSearch
} from 'react-icons/fi';
import moment from 'moment';
import { useGetAllJobsQuery } from '../jobs/services/jobApi';
import './jobCandidates.scss';

const { Text } = Typography;

const JobCandidateList = ({ applications, loading }) => {
    const { data: jobs, isLoading: jobsLoading } = useGetAllJobsQuery();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    // Function to get job title by job ID
    const getJobTitle = (jobId) => {
        if (!jobs || !jobs.data) return 'N/A';
        const job = jobs.data.find(job => job.id === jobId);
        return job ? job.title : 'N/A';
    };

    const statuses = [
        { id: 'pending', name: 'Pending' },
        { id: 'shortlisted', name: 'Shortlisted' },
        { id: 'selected', name: 'Selected' },
        { id: 'rejected', name: 'Rejected' },
    ];

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            width: 350,
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                <div style={{ padding: 8 }}>
                    <Input
                        placeholder="Search candidate name"
                        value={selectedKeys[0]}
                        onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                        onPressEnter={() => confirm()}
                        style={{ width: 188, marginBottom: 8, display: 'block' }}
                    />
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => confirm()}
                            icon={<FiSearch />}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Search
                        </Button>
                        <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
                            Reset
                        </Button>
                    </Space>
                </div>
            ),
            onFilter: (value, record) =>
                record.name?.toLowerCase().includes(value.toLowerCase()),
            sorter: (a, b) => {
                if (!a.name && !b.name) return 0;
                if (!a.name) return -1;
                if (!b.name) return 1;
                return a.name.localeCompare(b.name);
            },
            render: (text) => (
                <div className="item-wrapper">
                    <div className="item-content">
                        <div className="icon-wrapper">
                            <FiUser size={16} />
                        </div>
                        <div className="info-wrapper">
                            <div className="name" style={{ 
                                color: "#262626", 
                                fontWeight: 600, 
                                fontSize: isMobile ? "13px" : isMobile ? "14px" : "15px" 
                            }}>{text}</div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Job',
            dataIndex: 'job',
            key: 'job',
            width: 200,
            sorter: (a, b) => {
                if (!a.job && !b.job) return 0;
                if (!a.job) return -1;
                if (!b.job) return 1;
                return a.job.toString().localeCompare(b.job.toString());
            },
            render: (jobId) => (
                <div className="column-icon">
                    <div className="icon-bg" style={{
                        color: "#8b5cf6",
                        background: "rgba(139, 92, 246, 0.1)"
                    }}>
                        <FiBriefcase size={16} />
                    </div>
                    <Text style={{ 
                        fontSize: isMobile ? "12px" : isMobile ? "13px" : "14px",
                        color: "#4b5563"
                    }}>{getJobTitle(jobId)}</Text>
                </div>
            )
        },
        {
            title: 'Notice Period',
            dataIndex: 'notice_period',
            key: 'notice_period',
            sorter: (a, b) => {
                if (!a.notice_period && !b.notice_period) return 0;
                if (!a.notice_period) return -1;
                if (!b.notice_period) return 1;
                return a.notice_period.localeCompare(b.notice_period);
            },
            render: (text) => (
                <div className="column-icon">
                    <div className="icon-bg" style={{
                        color: "#10b981",
                        background: "rgba(16, 185, 129, 0.1)"
                    }}>
                        <FiClock size={16} />
                    </div>
                    <Text style={{ 
                        fontSize: isMobile ? "12px" : isMobile ? "13px" : "14px",
                        color: "#4b5563"
                    }}>{text}</Text>
                </div>
            )
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
            sorter: (a, b) => {
                if (!a.phone && !b.phone) return 0;
                if (!a.phone) return -1;
                if (!b.phone) return 1;
                return a.phone.localeCompare(b.phone);
            },
            render: (text) => (
                <div className="column-icon">
                    <div className="icon-bg" style={{
                        color: "#f59e0b",
                        background: "rgba(245, 158, 11, 0.1)"
                    }}>
                        <FiPhone size={16} />
                    </div>
                    <Text style={{ 
                        fontSize: isMobile ? "12px" : isMobile ? "13px" : "14px",
                        color: "#4b5563"
                    }}>{text}</Text>
                </div>
            )
        },
        {
            title: 'Experience',
            dataIndex: 'total_experience',
            key: 'total_experience',
            sorter: (a, b) => {
                if (!a.total_experience && !b.total_experience) return 0;
                if (!a.total_experience) return -1;
                if (!b.total_experience) return 1;
                return a.total_experience.localeCompare(b.total_experience);
            },
            render: (text) => (
                <div className="column-icon">
                    <div className="icon-bg" style={{
                        color: "#6366f1",
                        background: "rgba(99, 102, 241, 0.1)"
                    }}>
                        <FiHash size={16} />
                    </div>
                    <Text style={{ 
                        fontSize: isMobile ? "12px" : isMobile ? "13px" : "14px",
                        color: "#4b5563"
                    }}>{text} years</Text>
                </div>
            )
        },
        {
            title: 'Applied Source',
            dataIndex: 'applied_source',
            key: 'applied_source',
            width: 200,
            sorter: (a, b) => {
                if (!a.applied_source && !b.applied_source) return 0;
                if (!a.applied_source) return -1;
                if (!b.applied_source) return 1;
                return a.applied_source.localeCompare(b.applied_source);
            },
            render: (text) => (
                <div className="column-icon">
                    <div className="icon-bg" style={{
                        color: "#3b82f6",
                        background: "rgba(59, 130, 246, 0.1)"
                    }}>
                        <FiGlobe size={16} />
                    </div>
                    <Text style={{ 
                        fontSize: isMobile ? "12px" : isMobile ? "13px" : "14px",
                        color: "#4b5563"
                    }}>{text}</Text>
                </div>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            filters: statuses.map(status => ({
                text: status.name,
                value: status.id
            })),
            onFilter: (value, record) => record.status === value,
            render: (status) => {
                if (!status) return <Tag color="default">N/A</Tag>;

                let color;
                let bgColor;
                switch (status.toLowerCase()) {
                    case 'pending':
                        color = '#faad14';
                        bgColor = '#fff7e6';
                        break;
                    case 'shortlisted':
                        color = '#1890ff';
                        bgColor = '#e6f7ff';
                        break;
                    case 'selected':
                        color = '#52c41a';
                        bgColor = '#f6ffed';
                        break;
                    case 'rejected':
                        color = '#ff4d4f';
                        bgColor = '#fff1f0';
                        break;
                    default:
                        color = '#8c8c8c';
                        bgColor = '#f5f5f5';
                }
                return (
                    <Tag
                        style={{
                            color: color,
                            background: bgColor,
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            textTransform: 'capitalize',
                            fontSize: isMobile ? "11px" : isMobile ? "12px" : "13px"
                        }}
                    >
                        {status.replace(/_/g, ' ')}
                    </Tag>
                );
            }
        }
    ];

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      }, []);
    
      const paginationConfig = {
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} items`,
        pageSizeOptions: ['10', '20', '50', '100'],
        locale: {
          items_per_page: isMobile ? '' : '/ page', // Hide '/ page' on mobile/tablet
        },
      };

    return (
        <div className="job-candidates-page">
            {/* <div className="job-candidates-table-card" style={{ 
                // maxHeight: 'calc(100vh - 250px)',
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: '#d4d4d4 #f5f5f5'
            }}> */}
                <Table
                    columns={columns}
                    dataSource={applications || []}
                    rowKey="id"
                    loading={loading}
                    className="custom-table"
                    scroll={{ x: 1500, y: '' }}
                    pagination={paginationConfig}
                    style={{
                        width: "100%",
                        minWidth: 0,
                        background: "#ffffff", 
                        borderRadius: "8px",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                    }}
                />
            {/* </div> */}
        </div>
    );
};

export default JobCandidateList;
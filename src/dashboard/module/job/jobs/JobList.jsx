import React, { useState, useEffect } from "react";
import { Table, Button, Tag, Dropdown, Typography, Input, Space, Select } from "antd";
import {
    FiEdit2,
    FiTrash2,
    FiMoreVertical,
    FiBriefcase,
    FiClock,
    FiCalendar,
    FiUsers,
    FiSearch,
    FiCode,
    FiHash
} from "react-icons/fi";
import dayjs from "dayjs";
import { useGetAllCurrenciesQuery } from '../../../../superadmin/module/settings/services/settingsApi';
import './job.scss';

const { Text } = Typography;
const { Option } = Select;

const JobList = ({ jobs = [], onEdit, onDelete, loading, pagination }) => {
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [filteredInfo, setFilteredInfo] = useState({});
    const [sortedInfo, setSortedInfo] = useState({});

    // Clear selections when jobs data changes
    useEffect(() => {
        setSelectedRowKeys([]);
    }, [jobs]);

    const { data: currencies } = useGetAllCurrenciesQuery({
        page: 1,
        limit: 100
    });

    const handleChange = (newPagination, filters, sorter) => {
        setFilteredInfo(filters);
        setSortedInfo(sorter);
        if (pagination?.onChange) {
            pagination.onChange(newPagination, filters, sorter);
        }
    };

    const clearFilters = () => {
        setFilteredInfo({});
    };

    const clearAll = () => {
        setFilteredInfo({});
        setSortedInfo({});
    };

    const getCurrencyDetails = (currencyId) => {
        if (!currencies || !currencyId) return { icon: '', code: '' };
        const currency = currencies.find(c => c.id === currencyId);
        return {
            icon: currency?.currencyIcon || '',
            code: currency?.currencyCode || ''
        };
    };

    // Format salary with currency
    const formatSalary = (salary, currencyId) => {
        const { code } = getCurrencyDetails(currencyId);
        return `${code} ${salary}`;
    };

    // Row selection config
    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys) => {
            setSelectedRowKeys(newSelectedRowKeys);
        }
    };

    // Handle bulk delete
    const handleBulkDelete = async () => {
        await onDelete(selectedRowKeys);
        setSelectedRowKeys([]); // Clear selections after delete
    };

    // Bulk actions component
    const BulkActions = () => (
        <div className="bulk-actions" style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
            {selectedRowKeys.length > 0 && (
                <Button
                    type="primary"
                    danger
                    icon={<FiTrash2 size={16} />}
                    onClick={handleBulkDelete}
                >
                    Delete Selected ({selectedRowKeys.length})
                </Button>
            )}
        </div>
    );

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return { color: '#52c41a', background: '#f6ffed' };
            case 'closed':
                return { color: '#ff4d4f', background: '#fff1f0' };
            case 'draft':
                return { color: '#faad14', background: '#fff7e6' };
            default:
                return { color: '#8c8c8c', background: '#f5f5f5' };
        }
    };

    // Parse JSON string fields
    const parseJsonField = (jsonString, field) => {
        try {
            if (!jsonString) return [];
            
            // If the field is already an object, use it directly
            if (typeof jsonString === 'object') {
                if (field === 'skills') {
                    return jsonString.Skills ? jsonString.Skills.split(',').filter(skill => skill.trim()) : [];
                } else if (field === 'interviewRounds') {
                    return jsonString.InterviewRounds ? jsonString.InterviewRounds.split(',').filter(round => round.trim()) : [];
                }
            }
            
            // If it's a string, try to parse it
            const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
            
            if (field === 'skills') {
                return parsed.Skills ? parsed.Skills.split(',').filter(skill => skill.trim()) : [];
            } else if (field === 'interviewRounds') {
                return parsed.InterviewRounds ? parsed.InterviewRounds.split(',').filter(round => round.trim()) : [];
            }
            return [];
        } catch (e) {
            console.error('Error parsing field:', e);
            return [];
        }
    };

    const columns = [
        {
            title: "Job Title",
            dataIndex: "title",
            key: "title",
            // width: 300,
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                <div style={{ padding: 8 }}>
                    <Input
                        placeholder="Search job title"
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
            filterIcon: filtered => <FiSearch style={{ color: filtered ? '#1890ff' : undefined }} />,
            onFilter: (value, record) =>
                record.title?.toLowerCase().includes(value.toLowerCase()),
            render: (text, record) => (
                <div className="item-wrapper">
                    <div className="item-content">
                        <div className="icon-wrapper" style={{
                            color: "#1890ff",
                            background: "rgba(24, 144, 255, 0.1)",
                            width: "40px",
                            height: "40px",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            <FiBriefcase size={20} />
                        </div>
                        <div className="info-wrapper">
                            <div className="name" style={{ color: "#262626", fontWeight: 600, fontSize: "15px" }}>{text}</div>
                            <div className="subtitle" style={{ color: "#8c8c8c", fontSize: "13px" }}>
                            •   {record.category} <br />
                                •{record.workExperience} <br />
                                 •{record.location}
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: "Skills",
            key: "skills",
            render: (_, record) => {
                const skills = parseJsonField(record.skills, 'skills');
                return (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{
                            color: "#6366f1",
                            background: "rgba(99, 102, 241, 0.1)",
                            width: "32px",
                            height: "32px",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            
                            flexShrink: 0
                        }}>
                            <FiCode size={16} />
                        </div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', flex: 1 }}>
                            {skills.length > 0 ? (
                                skills.map((skill, index) => (
                                    <Tag
                                        key={index}
                                        style={{
                                            background: "#f4f7fe",
                                            color: "#6366f1",
                                            border: "none",
                                            borderRadius: "6px",
                                            padding: "6px 12px",
                                            fontSize: "12px",
                                            fontWeight: 500,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px"
                                        }}
                                    >
                                        <FiHash size={16} style={{ color: "#6366f1" }} />
                                        {skill}
                                    </Tag>
                                ))
                            ) : (
                                <span style={{ color: "#9ca3af", fontSize: "13px", fontStyle: "italic" }}>
                                    No skills specified
                                </span>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            title: "Type",
            dataIndex: "jobType",
            key: "jobType",
            filters: [
                { text: 'Full-time', value: 'Full-time' },
                { text: 'Part-time', value: 'Part-time' },
                { text: 'Contract', value: 'Contract' },
                { text: 'Internship', value: 'Internship' },
            ],
            onFilter: (value, record) => record.jobType === value,
            render: (type) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        color: "#8b5cf6",
                        background: "rgba(139, 92, 246, 0.1)",
                        width: "32px",
                        height: "32px",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        <FiClock size={16} />
                    </div>
                    <span style={{ color: "#4b5563", textTransform: "capitalize" }}>{type}</span>
                </div>
            ),
        },
        {
            title: "Openings",
            dataIndex: "totalOpenings",
            key: "totalOpenings",
            sorter: (a, b) => a.totalOpenings - b.totalOpenings,
            render: (openings) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        color: "#10b981",
                        background: "rgba(16, 185, 129, 0.1)",
                        width: "32px",
                        height: "32px",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        <FiUsers size={16} />
                    </div>
                    <span style={{ color: "#4b5563", fontWeight: "500" }}>{openings}</span>
                </div>
            ),
        },
        {
            title: "Interview Rounds",
            key: "interviewRounds",
            render: (_, record) => {
                const rounds = parseJsonField(record.interviewRounds, 'interviewRounds');
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            color: "#8b5cf6",
                            background: "rgba(139, 92, 246, 0.1)",
                            width: "32px",
                            height: "32px",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                        }}>
                            <FiUsers size={16} />
                        </div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', flex: 1 }}>
                            {rounds.length > 0 ? (
                                rounds.map((round, index) => (
                                    <Tag key={index} style={{
                                        background: "#f3e8ff",
                                        color: "#8b5cf6",
                                        border: "none",
                                        borderRadius: "4px",
                                        padding: "2px 8px",
                                        fontSize: "12px"
                                    }}>
                                        {round}
                                    </Tag>
                                ))
                            ) : (
                                <span style={{ color: "#9ca3af", fontSize: "13px", fontStyle: "italic" }}>
                                    No rounds specified
                                </span>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            title: "Salary",
            key: "salary",
            sorter: (a, b) => a.expectedSalary - b.expectedSalary,
            render: (_, record) => {
                const { icon, code } = getCurrencyDetails(record.currency);
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            color: "#059669",
                            background: "rgba(5, 150, 105, 0.1)",
                            width: "32px",
                            height: "32px",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            {icon ? (
                                <span style={{ fontSize: '16px' }}>{icon}</span>
                            ) : null}
                        </div>
                        <span style={{ color: "#059669", fontWeight: "600" }}>
                            {code} {record.expectedSalary}
                        </span>
                    </div>
                );
            },
        },
        {
            title: "Posted Date",
            dataIndex: "createdAt",
            key: "createdAt",
            sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
            render: (date) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        color: "#3b82f6",
                        background: "rgba(59, 130, 246, 0.1)",
                        width: "32px",
                        height: "32px",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        <FiCalendar size={16} />
                    </div>
                    <span style={{ color: "#4b5563" }}>{dayjs(date).format('DD MMM YYYY')}</span>
                </div>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            filters: [
                { text: 'Active', value: 'active' },
                { text: 'Closed', value: 'closed' },
                { text: 'Draft', value: 'draft' },
            ],
            onFilter: (value, record) => record.status === value,
            render: (status) => {
                const config = getStatusColor(status);
                return (
                    <Tag
                        style={{
                            color: config.color,
                            background: config.background,
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            textTransform: 'capitalize'
                        }}
                    >
                        {status}
                    </Tag>
                );
            },
        },
        {
            title: "Actions",
            key: "actions",
            width: 80,
            fixed: 'right',
            render: (_, record) => {
                const menuItems = [
                    {
                        key: 'edit',
                        icon: <FiEdit2 size={14} />,
                        label: 'Edit',
                        onClick: (e) => {
                            e.domEvent.stopPropagation();
                            onEdit(record);
                        }
                    }
                ];

                if (record.status !== 'closed') {
                    menuItems.push({
                        key: 'delete',
                        icon: <FiTrash2 size={14} />,
                        label: 'Delete',
                        danger: true,
                        onClick: (e) => {
                            e.domEvent.stopPropagation();
                            onDelete(record.id);
                        }
                    });
                }

                return (
                    <div onClick={(e) => e.stopPropagation()}>
                        <Dropdown
                            menu={{
                                items: menuItems,
                                onClick: (e) => e.domEvent.stopPropagation()
                            }}
                            trigger={['click']}
                            placement="bottomRight"
                        >
                            <Button
                                type="text"
                                icon={<FiMoreVertical size={16} />}
                                className="action-button"
                            />
                        </Dropdown>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="job-list-container">
            <BulkActions />
            <Table
                rowSelection={rowSelection}
                columns={columns}
                dataSource={jobs}
                rowKey="id"
                loading={loading}
                onChange={handleChange}
                pagination={pagination || {
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} items`,
                }}
                className="custom-table"
                scroll={{ x: "max-content" , y : '' }}
                
            />
        </div>
    );
};
export default JobList; 
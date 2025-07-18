import React, { useState, useEffect } from 'react';
import {
    Card,
    Row,
    Col,
    Typography,
    Tag,
    Space,
    Button,
    Modal,
    Tooltip,
    Empty,
    message,
    Input,
    Divider,
    Checkbox,
    Dropdown
} from 'antd';
import {
    FiCalendar,
    FiMapPin,
    FiEdit2,
    FiTrash2,
    FiLink,
    FiCopy,
    FiEye,
    FiList,
    FiDownload,
    FiX,
    FiFileText,
    FiAlertCircle,
    FiMoreVertical
} from 'react-icons/fi';
import { QRCodeCanvas } from 'qrcode.react';
import dayjs from 'dayjs';
import './CustomForm.scss';
import { useNavigate } from 'react-router-dom';
import {
    EditOutlined,
    DeleteOutlined,
    LinkOutlined,
    EyeOutlined,
    FileTextOutlined,
    QrcodeOutlined
} from '@ant-design/icons';
import { jsPDF } from 'jspdf';
import { useGetAllSettingsQuery } from '../../../../superadmin/module/settings/general/services/settingApi';

const { Title, Text } = Typography;

const CustomFormList = ({ data = [], onEdit, onDelete, onBulkDelete }) => {
    const [qrModalVisible, setQrModalVisible] = useState(false);
    const [selectedFormUrl, setSelectedFormUrl] = useState('');
    const [selectedFormTitle, setSelectedFormTitle] = useState('');
    const [selectedForm, setSelectedForm] = useState(null);
    const [selectedForms, setSelectedForms] = useState([]);
    const navigate = useNavigate();
    const { data: settingsData } = useGetAllSettingsQuery();

    const companyLogo = settingsData?.data[0]?.companylogo;
    const companyName = settingsData?.data[0]?.companyName;

    const showQrCode = (form) => {
        const formUrl = `${window.location.origin}/forms/${form.id}`;
        setSelectedFormUrl(formUrl);
        setSelectedFormTitle(form.title);
        setSelectedForm(form);
        setQrModalVisible(true);
    };

    const copyLink = (formId) => {
        const formUrl = `${window.location.origin}/forms/${formId}`;
        navigator.clipboard.writeText(formUrl);
        message.success('Link copied to clipboard!');
    };

    const handleViewForm = (formId) => {
        const formUrl = `${window.location.origin}/forms/${formId}`;
        window.open(formUrl, '_blank');
    };

    const downloadQRCode = () => {
        const qrContainer = document.getElementById('qr-container');

        if (qrContainer) {
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'in',
                format: [5, 7],
                hotfixes: ['px_scaling'],
                compress: false
            });

            // Create a temporary canvas with 4x resolution for ultra-high quality
            const tempCanvas = document.createElement('canvas');
            const ctx = tempCanvas.getContext('2d');
            tempCanvas.width = 1500;  // 5 inches * 300 DPI
            tempCanvas.height = 2100; // 7 inches * 300 DPI
            ctx.scale(3, 3); // Scale for 300 DPI

            // Enable best quality rendering
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Fill white background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, 500, 700);

            // Draw top wave background
            const gradient = ctx.createLinearGradient(0, 0, 0, 140);
            gradient.addColorStop(0, '#f0f7ff');
            gradient.addColorStop(1, '#e6f4ff');
            ctx.fillStyle = gradient;

            // Create wave path - more subtle curve
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(500, 0);
            ctx.lineTo(500, 80);
            ctx.bezierCurveTo(375, 140, 125, 140, 0, 80);
            ctx.closePath();
            ctx.fill();

            // Load and draw company logo
            const logo = new Image();
            const smallLogo = new Image();

            // Set crossOrigin attribute for both images
            logo.crossOrigin = "anonymous";
            smallLogo.crossOrigin = "anonymous";

            Promise.all([
                new Promise(resolve => {
                    logo.onload = resolve;
                    logo.src = companyLogo || '/src/assets/logo/Group 48096906.png';
                }),
                new Promise(resolve => {
                    smallLogo.onload = resolve;
                    smallLogo.src = companyLogo || '/src/assets/icons/icon-96x96.png';
                })
            ]).then(() => {
                try {
                    // Draw logo at the top
                    const logoHeight = 80;
                    const logoWidth = (logo.width / logo.height) * logoHeight;
                    const logoX = (500 - logoWidth) / 2;
                    ctx.drawImage(logo, logoX, 20, logoWidth, logoHeight);

                    // Title text
                    ctx.textAlign = 'center';
                    ctx.font = '600 24px "Poppins"';
                    ctx.fillStyle = '#1890ff';
                    ctx.fillText(selectedForm.event_name, 250, 160);

                    // Location text
                    ctx.font = '400 15px "Poppins"';
                    ctx.fillStyle = '#666666';
                    ctx.fillText(selectedForm.event_location, 250, 190);

                    // Date text
                    const dateText = `${dayjs(selectedForm.start_date).format('MMM D')} - ${dayjs(selectedForm.end_date).format('MMM D, YYYY')}`;
                    ctx.fillText(dateText, 250, 215);

                    // Draw QR code container with enhanced quality
                    const qrCanvas = document.getElementById('qr-code-canvas');
                    if (qrCanvas) {
                        const qrSize = 280;
                        const x = (500 - qrSize) / 2;
                        const y = 270;

                        // Draw card shadow and background
                        ctx.save();
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
                        ctx.shadowBlur = 30;
                        ctx.shadowOffsetY = 6;
                        ctx.fillStyle = '#FFFFFF';
                        ctx.beginPath();
                        ctx.roundRect(x - 20, y - 20, qrSize + 40, qrSize + 40, 16);
                        ctx.fill();
                        ctx.restore();

                        // Add subtle border
                        ctx.strokeStyle = 'rgba(24, 144, 255, 0.1)';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.roundRect(x - 20, y - 20, qrSize + 40, qrSize + 40, 16);
                        ctx.stroke();

                        // Draw QR code
                        ctx.drawImage(qrCanvas, x, y, qrSize, qrSize);

                        // Draw small company logo in center of QR code
                        const qrLogoSize = 45;
                        const qrLogoX = x + (qrSize - qrLogoSize) / 2;
                        const qrLogoY = y + (qrSize - qrLogoSize) / 2;

                        // Draw white background for QR logo
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(qrLogoX - 3, qrLogoY - 3, qrLogoSize + 6, qrLogoSize + 6);

                        // Draw the small logo
                        ctx.drawImage(smallLogo, qrLogoX, qrLogoY, qrLogoSize, qrLogoSize);
                    }

                    // Bottom text
                    ctx.font = '500 15px "Poppins"';
                    ctx.fillStyle = '#666666';
                    ctx.textAlign = 'center';
                    ctx.fillText('Scan to access form', 250, 600);

                    // Powered by text
                    ctx.font = '400 13px "Poppins"';
                    ctx.fillStyle = '#999999';
                    ctx.textAlign = 'right';
                    ctx.fillText('Powered by', 235, 630);

                    // Company name text with gradient
                    const gradient = ctx.createLinearGradient(240, 630, 300, 630);
                    gradient.addColorStop(0, '#1890ff');
                    gradient.addColorStop(1, '#096dd9');
                    ctx.fillStyle = gradient;
                    ctx.font = '600 13px "Poppins"';
                    ctx.textAlign = 'left';
                    ctx.fillText(companyName || 'Raiser CRM', 245, 630);

                    // Convert to PDF with maximum quality
                    pdf.addImage(
                        tempCanvas.toDataURL('image/jpeg', 1.0),
                        'JPEG',
                        0,
                        0,
                        5,
                        7,
                        undefined,
                        'FAST'
                    );

                    // Download with better quality
                    const pdfOutput = pdf.output('blob');
                    const fileName = `${selectedForm.title || 'form'}-qr.pdf`;

                    // Use direct download
                    const url = window.URL.createObjectURL(pdfOutput);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();

                    // Clean up
                    setTimeout(() => {
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                    }, 100);
                    message.success('QR Code downloaded successfully!');
                } catch (error) {
                    console.error('Error generating PDF:', error);
                    message.error('Failed to generate PDF. Please try again.');
                }
            }).catch(error => {
                console.error('Error loading images:', error);
                message.error('Failed to load images. Please try again.');
            });
        }
    };

    const getFieldsCount = (fieldsString) => {
        try {
            const fields = JSON.parse(fieldsString);
            return Object.keys(fields).length;
        } catch (error) {
            return 0;
        }
    };

    const handleCardClick = (e, form) => {
        // Prevent navigation if clicking on action buttons
        if (e.target.closest('.card-actions')) {
            return;
        }
        navigate(`/dashboard/crm/custom-form/${form.id}/submissions`);
    };

    const handleSelectForm = (formId, checked) => {
        if (checked) {
            setSelectedForms(prev => [...prev, formId]);
        } else {
            setSelectedForms(prev => prev.filter(id => id !== formId));
        }
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedForms(data.map(form => form.id));
        } else {
            setSelectedForms([]);
        }
    };

    const handleBulkDelete = () => {
        if (selectedForms.length === 0) {
            message.warning('Please select forms to delete');
            return;
        }

        Modal.confirm({
            title: 'Delete Selected Forms',
            content: `Are you sure you want to delete ${selectedForms.length} selected forms?`,
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            bodyStyle: {
                padding: "20px",
            },
            onOk: async () => {
                try {
                    await onBulkDelete(selectedForms);
                    message.success(`${selectedForms.length} forms deleted successfully`);
                    setSelectedForms([]);
                } catch (error) {
                    message.error(error?.data?.message || 'Failed to delete forms');
                }
            },
        });
    };

    const getActionItems = (form) => [
        { key: 'view', label: 'View Submissions', icon: <EyeOutlined /> },
        { key: 'edit', label: 'Edit Form', icon: <EditOutlined /> },
        { key: 'copy', label: 'Copy Link', icon: <LinkOutlined /> },
        { key: 'qr', label: 'QR Code', icon: <QrcodeOutlined /> },
        { key: 'delete', label: 'Delete Form', icon: <DeleteOutlined />, danger: true }
    ];

    if (!data || data.length === 0) {
        return (
            <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No custom forms found"
            />
        );
    }

    return (
        <>
            <div className="bulk-actions" style={{ marginBottom: 16 }}>
                <Space>
                    <Checkbox
                        checked={selectedForms.length === data.length}
                        indeterminate={selectedForms.length > 0 && selectedForms.length < data.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                    >
                        Select All
                    </Checkbox>
                    {selectedForms.length > 0 && (
                        <Button
                            type="primary"
                            danger
                            icon={<FiTrash2 size={16} />}
                            onClick={handleBulkDelete}
                        >
                            Delete Selected ({selectedForms.length})
                        </Button>
                    )}
                </Space>
            </div>

            <Row gutter={[24, 24]} className="custom-form-list">
                {data.map((form) => (
                    <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={8} key={form.id}>
                        <Card
                            hoverable
                            className={`custom-form-card ${selectedForms.includes(form.id) ? 'selected' : ''}`}
                            bodyStyle={{
                                padding: "0",
                            }}
                            onClick={(e) => handleCardClick(e, form)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="card-header-gradient">
                                <div className="card-header-content">
                                    <div className="form-icon">
                                        <FiFileText />
                                    </div>
                                    <div className="form-count">
                                        <Text>{getFieldsCount(form.fields)}</Text>
                                        <Text>Fields</Text>
                                    </div>
                                </div>
                            </div>

                            <div className="card-content">
                                <div className="card-checkbox">
                                    <Checkbox
                                        checked={selectedForms.includes(form.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            handleSelectForm(form.id, e.target.checked);
                                        }}
                                    />
                                </div>
                                <div className="form-header">
                                    <Title level={4} ellipsis={{ tooltip: form.title }}>
                                        {form.title}
                                    </Title>
                                    <Text type="secondary" ellipsis={{ tooltip: form.description }}>
                                        {form.description}
                                    </Text>
                                </div>

                                <div className="form-details">
                                    <div className="detail-item">
                                        <FiCalendar className="icon" />
                                        <div className="detail-content">
                                            <Text type="secondary">Event</Text>
                                            <Text strong ellipsis>{form.event_name}</Text>
                                        </div>
                                    <div className="detail-item">
                                        <FiMapPin className="icon" />
                                        <div className="detail-content">
                                            <Text type="secondary">Location</Text>
                                            <Text strong ellipsis>{form.event_location}</Text>
                                        </div>
                                    </div>
                                    </div>
                                </div>

                                <div className="form-dates">
                                    <div className="date-item">
                                        <Text type="secondary">Starts</Text>
                                        <Tag color="blue">
                                            {dayjs(form.start_date).format('MMM D, YYYY')}
                                        </Tag>
                                    </div>
                                    <div className="date-item">
                                        <Text type="secondary">Ends</Text>
                                        <Tag color="green">
                                            {dayjs(form.end_date).format('MMM D, YYYY')}
                                        </Tag>
                                    </div>
                                </div>

                                <Divider style={{ margin: '16px 0' }} />

                                <div className="form-footer">
                                    <div className="created-info">
                                        <Text type="secondary" className="created-by">
                                            {form.created_by}
                                        </Text>
                                        <Text type="secondary" className="created-date">
                                            {dayjs(form.createdAt).format('MMM D, YYYY')}
                                        </Text>
                                    </div>
                                    <div className="action-buttons">
                                        <div className="desktop-actions">
                                            <Tooltip title="View Submissions">
                                                <Button
                                                    type="text"
                                                    icon={<EyeOutlined />}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/dashboard/crm/custom-form/${form.id}/submissions`);
                                                    }}
                                                />
                                            </Tooltip>
                                            <Tooltip title="Edit Form">
                                                <Button
                                                    type="text"
                                                    icon={<EditOutlined />}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEdit(form);
                                                    }}
                                                />
                                            </Tooltip>
                                            <Tooltip title="Copy Link">
                                                <Button
                                                    type="text"
                                                    icon={<LinkOutlined />}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        copyLink(form.id);
                                                    }}
                                                />
                                            </Tooltip>
                                            <Tooltip title="QR Code">
                                                <Button
                                                    type="text"
                                                    icon={<QrcodeOutlined />}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        showQrCode(form);
                                                    }}
                                                />
                                            </Tooltip>
                                            <Tooltip title="Delete Form">
                                                <Button
                                                    type="text"
                                                    icon={<DeleteOutlined />}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDelete(form);
                                                    }}
                                                />
                                            </Tooltip>
                                        </div>
                                        <div className="mobile-actions">
                                            <Dropdown
                                                menu={{
                                                    items: getActionItems(form),
                                                    onClick: ({ key, domEvent }) => {
                                                        domEvent.stopPropagation();
                                                        switch (key) {
                                                            case 'view':
                                                                navigate(`/dashboard/crm/custom-form/${form.id}/submissions`);
                                                                break;
                                                            case 'edit':
                                                                onEdit(form);
                                                                break;
                                                            case 'copy':
                                                                copyLink(form.id);
                                                                break;
                                                            case 'qr':
                                                                showQrCode(form);
                                                                break;
                                                            case 'delete':
                                                                onDelete(form);
                                                                break;
                                                            default:
                                                                break;
                                                        }
                                                    }
                                                }}
                                                trigger={['click']}
                                                placement="bottomRight"
                                            >
                                                <Button
                                                    type="text"
                                                    icon={<FiMoreVertical />}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </Dropdown>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Modal
                title={null}
                open={qrModalVisible}
                onCancel={() => setQrModalVisible(false)}
                footer={null}
                width={550}
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
                        onClick={() => setQrModalVisible(false)}
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
                            <FiLink style={{ fontSize: "24px", color: "#ffffff" }} />
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
                                QR Code
                            </h2>
                            <Text
                                style={{
                                    fontSize: "14px",
                                    color: "rgba(255, 255, 255, 0.85)",
                                }}
                            >
                                Scan or download the QR code to access the form
                            </Text>
                        </div>
                    </div>
                </div>

                <div style={{ padding: "24px" }}>
                    <div id="qr-container" style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "24px",
                        background: "#ffffff",
                        padding: "32px",
                        borderRadius: "24px",
                        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
                        fontFamily: "'Poppins', sans-serif",
                        position: "relative",
                        overflow: "hidden"
                    }}>
                        <div style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: "160px",
                            background: "linear-gradient(135deg, #f0f7ff 0%, #e6f4ff 100%)",
                            borderRadius: "24px 24px 100% 100%",
                            zIndex: 0
                        }} />
                        <div style={{
                            marginTop: "12px",
                            width: "100%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            position: "relative",
                            zIndex: 1
                        }}>
                            <img
                                src={companyLogo || "/src/assets/logo/Group 48096906.png"}
                                alt={companyName}
                                style={{
                                    height: "80px",
                                    objectFit: "contain",
                                    filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))",
                                    marginBottom: "12px"
                                }}
                            />
                        </div>

                        {selectedForm && (
                            <div style={{
                                textAlign: "center",
                                marginTop: "8px",
                                position: "relative",
                                zIndex: 1
                            }}>
                                <Text strong style={{
                                    fontSize: "22px",
                                    display: "block",
                                    fontFamily: "'Poppins', sans-serif",
                                    marginBottom: "12px",
                                    color: "#1890ff",
                                    fontWeight: "600"
                                }}>
                                    {selectedForm.event_name}
                                </Text>
                                <Text style={{
                                    fontSize: "15px",
                                    display: "block",
                                    margin: "4px 0",
                                    color: "#666",
                                    fontFamily: "'Poppins', sans-serif"
                                }}>
                                    {selectedForm.event_location}
                                </Text>
                                <Text style={{
                                    fontSize: "15px",
                                    color: "#666",
                                    fontFamily: "'Poppins', sans-serif"
                                }}>
                                    {dayjs(selectedForm.start_date).format('MMM D')} - {dayjs(selectedForm.end_date).format('MMM D, YYYY')}
                                </Text>
                            </div>
                        )}

                        <div style={{
                            position: "relative",
                            zIndex: 1,
                            background: "white",
                            padding: "24px",
                            borderRadius: "20px",
                            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(24, 144, 255, 0.08)",
                            transform: "translateY(0)",
                            transition: "transform 0.3s ease",
                            border: "1px solid rgba(24, 144, 255, 0.1)"
                        }}>
                            <QRCodeCanvas
                                id="qr-code-canvas"
                                value={selectedFormUrl}
                                size={280}
                                level="H"
                                includeMargin={true}
                                imageSettings={{
                                    src: companyLogo || "/src/assets/icons/icon-96x96.png",
                                    x: undefined,
                                    y: undefined,
                                    height: 50,
                                    width: 50,
                                    excavate: true,
                                }}
                            />
                        </div>

                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "8px",
                            position: "relative",
                            zIndex: 1
                        }}>
                            <Text style={{
                                fontSize: "15px",
                                color: "#666",
                                fontFamily: "'Poppins', sans-serif",
                                fontWeight: 500
                            }}>
                                Scan to access form
                            </Text>

                            <Text style={{
                                fontSize: "13px",
                                color: "#999",
                                fontFamily: "'Poppins', sans-serif",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px"
                            }}>
                                Powered by <span style={{ fontWeight: 600, background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{companyName || 'Raiser CRM'}</span>
                            </Text>
                        </div>
                    </div>

                    <div style={{ marginTop: "24px" }}>
                        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                            <Input
                                value={selectedFormUrl}
                                readOnly
                                style={{
                                    borderRadius: "8px",
                                    flex: 1
                                }}
                            />
                            <Button
                                icon={<FiCopy />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(selectedFormUrl);
                                    message.success('Link copied to clipboard!');
                                }}
                                style={{
                                    borderRadius: "8px",
                                    height: "40px",
                                }}
                            >
                                Copy
                            </Button>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                            <Button
                                size="large"
                                onClick={() => setQrModalVisible(false)}
                                style={{
                                    padding: "8px 24px",
                                    height: "44px",
                                    borderRadius: "10px",
                                    fontWeight: "500",
                                }}
                            >
                                Close
                            </Button>
                            <Button
                                size="large"
                                type="primary"
                                icon={<FiDownload />}
                                onClick={downloadQRCode}
                                style={{
                                    padding: "8px 32px",
                                    height: "44px",
                                    borderRadius: "10px",
                                    fontWeight: "500",
                                    background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                                    border: "none",
                                    boxShadow: "0 4px 12px rgba(24, 144, 255, 0.15)",
                                }}
                            >
                                Download QR Code
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default CustomFormList;
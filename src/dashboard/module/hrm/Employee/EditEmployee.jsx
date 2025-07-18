import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Select, message, Typography, Divider, Upload, InputNumber, DatePicker } from 'antd';
import { 
    FiX, FiUserPlus, FiUser, FiMail, FiPhone, FiMapPin, FiGrid, FiAward, FiDollarSign,
    FiLock, FiPlus, FiCamera, FiChevronDown
} from 'react-icons/fi';
import { useUpdateEmployeeMutation } from './services/employeeApi';
import { useSelector } from 'react-redux';
import CreateBranch from '../Branch/CreateBranch';
import { useGetAllBranchesQuery } from '../Branch/services/branchApi';
import { useGetAllDepartmentsQuery } from '../Department/services/departmentApi';
import { useGetAllDesignationsQuery } from '../Designation/services/designationApi';
import CreateDepartment from '../Department/CreateDepartment';
import CreateDesignation from '../Designation/CreateDesignation';
import { useGetAllCountriesQuery, useGetAllCurrenciesQuery } from '../../../../superadmin/module/settings/services/settingsApi';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import localeData from 'dayjs/plugin/localeData';
import weekday from 'dayjs/plugin/weekday';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(localeData);
dayjs.extend(weekday);
dayjs.extend(advancedFormat);

const { Text } = Typography;
const { Option } = Select;

const findIndianDefaults = (currencies, countries) => {
    const inrCurrency = currencies?.find(c => c.currencyCode === 'INR');
    const indiaCountry = countries?.find(c => c.countryCode === 'IN');
    return {
        defaultCurrency: inrCurrency?.id || '',
        defaultPhoneCode: indiaCountry?.id || ''
    };
};

const formatDateSafely = (dateString) => {
    if (!dateString) return null;
    
    const parsed = dayjs(dateString);
    return parsed.isValid() ? parsed : null;
};

const EditEmployee = ({ visible, onCancel, initialValues, onSuccess }) => {


    const [form] = Form.useForm();
    const [updateEmployee, { isLoading }] = useUpdateEmployeeMutation();
    const [isCreateBranchModalOpen, setIsCreateBranchModalOpen] = useState(false);
    const [isCreateDepartmentModalOpen, setIsCreateDepartmentModalOpen] = useState(false);
    const [isCreateDesignationModalOpen, setIsCreateDesignationModalOpen] = useState(false);
    const [filteredDepartments, setFilteredDepartments] = useState([]);
    const [filteredDesignations, setFilteredDesignations] = useState([]);
    const [fileList, setFileList] = useState([]);
    const { data: countries, isLoading: countriesLoading } = useGetAllCountriesQuery({
        page: 1,
        limit: 100
    });
    const { data: currencies, isLoading: currenciesLoading } = useGetAllCurrenciesQuery({
        page: 1,
        limit: 100
    });

    const { data: branchesData } = useGetAllBranchesQuery();
    const { data: departmentsData } = useGetAllDepartmentsQuery();
    const { data: designationsData } = useGetAllDesignationsQuery();

    // Get default currency and phone code
    const { defaultCurrency, defaultPhoneCode } = findIndianDefaults(currencies, countries);

    // Reset form and load initial values when modal opens
    useEffect(() => {
        if (visible && initialValues) {
            // Format the data before setting it to the form
            const formattedValues = {
                // Basic Information
                firstName: initialValues.firstName || '',
                lastName: initialValues.lastName || '',
                username: initialValues.username || '',
                email: initialValues.email || '',
                phoneCode: initialValues.phoneCode || defaultPhoneCode,
                phone: initialValues.phone || '',
                address: initialValues.address || '',
                gender: initialValues.gender || '',
                
                // Employment Details
                joiningDate: formatDateSafely(initialValues.joiningDate),
                leaveDate: formatDateSafely(initialValues.leaveDate),
                branch: initialValues.branch || null,
                department: initialValues.department || null, // Map department ID
                designation: initialValues.designation || null, // Map designation ID
                
                // Salary Information
                salary: initialValues.salary || 0,
                
                // Bank Details
                accountholder: initialValues.accountholder || '',
                accountnumber: initialValues.accountnumber || '',
                bankname: initialValues.bankname || '',
                ifsc: initialValues.ifsc || '',
                banklocation: initialValues.banklocation || '',
                currency: initialValues.currency || defaultCurrency,
            };

            // Set form values
            form.setFieldsValue(formattedValues);
            
            // Set profile picture if exists
            if (initialValues?.profilePic) {
                setFileList([{
                    uid: '-1',
                    name: 'profile-picture.png',
                    status: 'done',
                    url: initialValues.profilePic,
                }]);
            } else {
                setFileList([]);
            }

            // Filter departments and designations if branch is selected
            if (formattedValues.branch) {
                handleBranchChange(formattedValues.branch);
            }

        } else {
            form.resetFields();
            setFileList([]);
        }
    }, [visible, initialValues, form, defaultCurrency, defaultPhoneCode]);

    // Transform branch data
    const branches = React.useMemo(() => {
        if (!branchesData) return [];
        if (Array.isArray(branchesData)) return branchesData;
        if (Array.isArray(branchesData.data)) return branchesData.data;
        return [];
    }, [branchesData]);

    // Transform department data
    const departments = React.useMemo(() => {
        if (!departmentsData) return [];
        if (Array.isArray(departmentsData)) return departmentsData;
        if (Array.isArray(departmentsData.data)) return departmentsData.data;
        return [];
    }, [departmentsData]);

    // Transform designation data
    const designations = React.useMemo(() => {
        if (!designationsData) return [];
        if (Array.isArray(designationsData)) return designationsData;
        if (Array.isArray(designationsData.data)) return designationsData.data;
        return [];
    }, [designationsData]);

    const handleCreateBranchSuccess = async (newBranch) => {
        setIsCreateBranchModalOpen(false);
        message.success('Branch created successfully');
        if (newBranch?.id) {
            form.setFieldValue('branch', newBranch.id);
        }
    };

    const handleCreateDepartmentSuccess = async (newDepartment) => {
        setIsCreateDepartmentModalOpen(false);
        message.success('Department created successfully');
        if (newDepartment?.id) {
            form.setFieldValue('department', newDepartment.id);
        }
    };

    const handleCreateDesignationSuccess = async (newDesignation) => {
        setIsCreateDesignationModalOpen(false);
        message.success('Designation created successfully');
        if (newDesignation?.id) {
            form.setFieldValue('designation', newDesignation.id);
        }
    };

    const dropdownRender = (menu) => (
        <>
            {menu}
            <Divider style={{ margin: '8px 0' }} />
            <div onClick={e => e.stopPropagation()}>
                <Button
                    type="link"
                    icon={<FiPlus style={{ fontSize: '16px' }} />}
                    onClick={() => setIsCreateBranchModalOpen(true)}
                    style={{
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        color: "white",
                        height: "44px",
                        borderRadius: "8px",
                        background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                        fontWeight: 500,
                        gap: '8px',
                    }}
                >
                    Add New Branch
                </Button>
            </div>
        </>
    );
     // Add this useEffect to set default currency when form is initialized
     React.useEffect(() => {
        form.setFieldsValue({
            currency: defaultCurrency
        });
    }, [form, defaultCurrency]);

    const departmentDropdownRender = (menu) => (
        <>
            {menu}
            <Divider style={{ margin: '8px 0' }} />
            <div onClick={e => e.stopPropagation()}>
                <Button
                    type="link"
                    icon={<FiPlus style={{ fontSize: '16px' }} />}
                    onClick={() => setIsCreateDepartmentModalOpen(true)}
                    style={{
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        color: "white",
                        height: "44px",
                        borderRadius: "8px",
                        background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                        fontWeight: 500,
                        gap: '8px'
                    }}
                >
                    Add New Department
                </Button>
            </div>
        </>
    );

    const designationDropdownRender = (menu) => (
        <>
            {menu}
            <Divider style={{ margin: '8px 0' }} />
            <div onClick={e => e.stopPropagation()}>
                <Button
                    type="link"
                    icon={<FiPlus style={{ fontSize: '16px' }} />}
                    onClick={() => setIsCreateDesignationModalOpen(true)}
                    style={{
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        color: "white",
                        height: "44px",
                        borderRadius: "8px",
                        background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                        fontWeight: 500,
                        gap: '8px'
                    }}
                >
                    Add New Designation
                </Button>
            </div>
        </>
    );

    const beforeUpload = (file) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('You can only upload image files!');
        }

        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('Image must be smaller than 2MB!');
        }

        return isImage && isLt2M;
    };

    const handleChange = ({ fileList }) => {
        setFileList(fileList);
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            // Find the country from the selected phone code ID
            const selectedCountry = countries?.find(c => c.id === values.phoneCode);
            if (!selectedCountry) {
                message.error('Please select a valid phone code');
                return;
            }

            const formData = new FormData();

            // Handle profile picture
            if (fileList.length > 0) {
                if (fileList[0].originFileObj) {
                    formData.append('profilePic', fileList[0].originFileObj);
                } else if (fileList[0].url) {
                    formData.append('profilePic', fileList[0].url);
                }
            }

            // Format data to match database structure
            const submitData = {
                id: initialValues.id,
                firstName: values.firstName,
                lastName: values.lastName,
                username: values.username,
                email: values.email,
                phoneCode: values.phoneCode, // Using the country ID directly
                phone: values.phone,
                address: values.address,
                gender: values.gender,
                joiningDate: values.joiningDate ? values.joiningDate.format('YYYY-MM-DD') : null,
                leaveDate: values.leaveDate ? values.leaveDate.format('YYYY-MM-DD') : null,
                branch: values.branch,
                department: values.department_name, // Map to department field
                designation: values.designation_name, // Map to designation field
                salary: values.salary,
                accountholder: values.accountholder,
                accountnumber: values.accountnumber,
                bankname: values.bankname,
                ifsc: values.ifsc,
                banklocation: values.banklocation,
                currency: values.currency,
            };

            // Append all data to FormData
            Object.keys(submitData).forEach(key => {
                if (submitData[key] !== undefined && submitData[key] !== null) {
                    formData.append(key, submitData[key]);
                }
            });

            // Call update mutation
            const response = await updateEmployee({
                id: initialValues.id,
                data: formData
            }).unwrap();

            if (response.success) {
                message.success('Employee updated successfully');
                onSuccess?.();
                onCancel();
            } else {
                message.error(response.message || 'Failed to update employee');
            }
        } catch (error) {
            console.error('Update error:', error);
            message.error(error?.data?.message || 'Failed to update employee');
        }
    };

    const handleBranchChange = (branchId) => {
        form.setFieldsValue({
            department: undefined,
            designation_name: undefined
        });

        const depts = departments.filter(dept => dept.branch === branchId);
        setFilteredDepartments(depts);

        const desigs = Array.isArray(designations) 
            ? designations.filter(desig => desig.branch === branchId)
            : [];
        setFilteredDesignations(desigs);
    };

    // Add this effect to handle initial branch, department, and designation
    useEffect(() => {
        if (visible && initialValues) {
            // Find branch name
            const selectedBranch = branches.find(branch => branch.id === initialValues.branch);
            
            if (selectedBranch) {
                // Set branch and filter departments and designations
                form.setFieldsValue({
                    branch: selectedBranch.id
                });

                // Filter and set departments for selected branch
                const depts = departments.filter(dept => dept.branch === selectedBranch.id);
                setFilteredDepartments(depts);

                // Filter and set designations for selected branch
                const desigs = designations.filter(desig => desig.branch === selectedBranch.id);
                setFilteredDesignations(desigs);

                // Find and set department
                const selectedDepartment = depts.find(dept => dept.id === initialValues.department);
                if (selectedDepartment) {
                    form.setFieldsValue({
                        department: selectedDepartment.id
                    });
                }

                // Find and set designation
                const selectedDesignation = desigs.find(desig => desig.id === initialValues.designation);
                if (selectedDesignation) {
                    form.setFieldsValue({
                        designation: selectedDesignation.id
                    });
                }
            }

            // Set other form values
            const formattedValues = {
                firstName: initialValues.firstName || '',
                lastName: initialValues.lastName || '',
                username: initialValues.username || '',
                email: initialValues.email || '',
                phoneCode: initialValues.phoneCode || defaultPhoneCode,
                phone: initialValues.phone || '',
                address: initialValues.address || '',
                gender: initialValues.gender || '',
                joiningDate: formatDateSafely(initialValues.joiningDate),
                leaveDate: formatDateSafely(initialValues.leaveDate),
                salary: initialValues.salary || 0,
                accountholder: initialValues.accountholder || '',
                accountnumber: initialValues.accountnumber || '',
                bankname: initialValues.bankname || '',
                ifsc: initialValues.ifsc || '',
                banklocation: initialValues.banklocation || '',
                currency: initialValues.currency || defaultCurrency,
            };

            form.setFieldsValue(formattedValues);
        }
    }, [visible, initialValues, branches, departments, designations, form, defaultCurrency, defaultPhoneCode]);

    return (
        <>
        <Modal
            title={null}
            open={visible}
            onCancel={() => {
                form.resetFields();
                onCancel();
            }}
            footer={null}
            width={720}
            destroyOnClose={true}
            centered
            closeIcon={null}
            className="pro-modal custom-modal"
            styles={{
                body: {
                    padding: 0,
                    overflow: "hidden",
                    borderRadius: "8px",
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
                    borderTopLeftRadius: "8px",
                    borderTopRightRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
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
                        backdropFilter: "blur(8px)",
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
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                        }}
                    >
                        <FiUserPlus style={{ fontSize: "24px", color: "#ffffff" }} />
                    </div>
                    <div>
                        <h2
                            style={{
                                margin: "0",
                                fontSize: "24px",
                                fontWeight: "600",
                                color: "#ffffff",
                                textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                            }}
                        >
                            Edit Employee
                        </h2>
                        <p
                            style={{
                                margin: "4px 0 0",
                                fontSize: "14px",
                                color: "rgba(255, 255, 255, 0.85)",
                            }}
                        >
                            Update employee information
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ padding: "24px" }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ marginRight: '16px' }}>
                        <Form.Item
                            name="profilePic"
                            noStyle
                        >
                            <Upload
                                name="profilePic"
                                listType="picture-circle"
                                className="avatar-uploader"
                                showUploadList={false}
                                beforeUpload={beforeUpload}
                                onChange={handleChange}
                                maxCount={1}
                            >
                                {fileList.length > 0 && (fileList[0].url || fileList[0].originFileObj) ? (
                                    <div style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        overflow: 'hidden',
                                        position: 'relative'
                                    }}>
                                        {fileList[0].originFileObj ? (
                                            <>
                                                <img
                                                    src={URL.createObjectURL(fileList[0].originFileObj)}
                                                    alt="avatar preview"
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                                <div style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    background: 'rgba(24, 144, 255, 0.2)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <div style={{
                                                        background: 'rgba(24, 144, 255, 0.8)',
                                                        color: 'white',
                                                        fontSize: '10px',
                                                        padding: '2px 6px',
                                                        borderRadius: '10px'
                                                    }}>
                                                        New
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <img
                                                src={fileList[0].url}
                                                alt="avatar"
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <div style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        background: '#f0f2f5',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px dashed #d9d9d9'
                                    }}>
                                        <FiCamera style={{ fontSize: '18px', color: '#1890ff' }} />
                                    </div>
                                )}
                            </Upload>
                        </Form.Item>
                    </div>
                    <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '500' }}>Profile Picture</h3>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            {fileList.length > 0 && fileList[0].originFileObj ? (
                                <>Selected: {fileList[0].name}</>
                            ) : (
                                <>Click to upload or change Profile Picture</>
                            )}
                        </Text>
                    </div>
                </div>

                <Divider />

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        currency: defaultCurrency,
                        phoneCode: defaultPhoneCode,
                    }}
                >
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(2, 1fr)', 
                        gap: '16px',
                        marginBottom: '24px'
                    }}>

                        <Form.Item
                            name="firstName"
                            label={<span style={{ color: "#262626", fontWeight: 500, fontSize: "14px" }}>First Name</span>}
                            rules={[
                                { required: true, message: "Please enter first name" },
                                {
                                    validator: (_, value) => {
                                        if (!value) return Promise.resolve();
                                        if (!/[a-z]/.test(value) && !/[A-Z]/.test(value)) { 
                                            return Promise.reject(
                                                new Error('First name must contain both uppercase and lowercase English letters')
                                            );
                                        }
                                        return Promise.resolve();
                                    }
                                }       
                            ]}
                        >
                            <Input
                                prefix={<FiUser style={{ color: '#1890ff', fontSize: '16px' }} />}
                                placeholder="Enter first name"
                                style={{
                                    borderRadius: "8px",
                                    border: "1px solid #d9d9d9",
                                    boxShadow: "none",
                                    height: "48px",
                                    fontSize: "14px",
                                    transition: "all 0.3s ease",
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="lastName"
                                label={<span style={{ color: "#262626", fontWeight: 500, fontSize: "14px" }}>Last Name</span>}
                        >
                            <Input
                                prefix={<FiUser style={{ color: '#1890ff', fontSize: '16px' }} />}
                                placeholder="Enter last name"
                                style={{
                                    borderRadius: "8px",
                                    border: "1px solid #d9d9d9",
                                    boxShadow: "none",
                                    height: "48px",
                                    fontSize: "14px",
                                    transition: "all 0.3s ease",
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="username"
                            label={<span style={{ color: "#262626", fontWeight: 500, fontSize: "14px" }}>Username</span>}
                            rules={[
                                { required: true, message: "Please enter username" },
                                { min: 3, message: "Username must be at least 3 characters" },
                                {
                                    validator: (_, value) => {
                                        if (!value) return Promise.resolve();
                                        if (!/[a-z]/.test(value) && !/[A-Z]/.test(value)) {
                                            return Promise.reject(
                                                new Error('Username must contain both uppercase and lowercase English letters')
                                            );
                                        }
                                        return Promise.resolve();
                                    }
                                }   
                            ]}
                        >
                            <Input
                                prefix={<FiUser style={{ color: '#1890ff', fontSize: '16px' }} />}
                                placeholder="Enter username"
                                style={{
                                    borderRadius: "8px",
                                    border: "1px solid #d9d9d9",
                                    boxShadow: "none",
                                    height: "48px",
                                    fontSize: "14px",
                                    transition: "all 0.3s ease",
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            label={<span style={{ color: "#262626", fontWeight: 500, fontSize: "14px" }}>Email</span>}
                            rules={[
                                { required: true, message: "Please enter email" },
                                { type: "email", message: "Please enter a valid email" }
                            ]}
                        >
                            <Input
                                prefix={<FiMail style={{ color: '#1890ff', fontSize: '16px' }} />}
                                placeholder="Enter email"
                                style={{
                                    borderRadius: "8px",
                                    border: "1px solid #d9d9d9",
                                    boxShadow: "none",
                                    height: "48px",
                                    fontSize: "14px",
                                    transition: "all 0.3s ease",
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label={<span style={{ color: "#262626", fontWeight: 500, fontSize: "14px" }}>Password</span>}
                            rules={[
                                { min: 8, message: 'Password must be at least 8 characters' },
                                {
                                    pattern: /^[a-zA-Z0-9!@#$%^&*]{8,30}$/,
                                    message: 'Password must contain only letters, numbers and special characters'
                                }
                            ]}
                            extra={<span style={{ color: "#8c8c8c", fontSize: "12px" }}>Password must be at least 8 characters long</span>}
                        >
                            <Input.Password
                                placeholder="Enter password"
                                style={{
                                    borderRadius: "8px",
                                    border: "1px solid #d9d9d9",
                                    boxShadow: "none",
                                    height: "48px",
                                    fontSize: "14px",
                                    transition: "all 0.3s ease",
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            label={
                                <span style={{
                                    fontSize: '14px',
                                    fontWeight: '500',
                                }}>
                                    Phone Number
                                </span>
                            }
                        >
                            <Input.Group compact className="phone-input-group" style={{
                                display: 'flex',
                                height: '48px',
                                backgroundColor: '#f8fafc',
                                borderRadius: '10px',
                                border: '1px solid #e6e8eb',
                                overflow: 'hidden'
                            }}>
                                <Form.Item
                                    name="phoneCode"
                                    noStyle
                                    initialValue={defaultPhoneCode}
                                >
                                    <Select
                                        size="large"
                                        style={{
                                            width: '120px',
                                            height: '48px'
                                        }}
                                        loading={countriesLoading}
                                        className="phone-code-select"
                                        dropdownStyle={{
                                            padding: '8px',
                                            borderRadius: '10px',
                                        }}
                                        showSearch
                                        optionFilterProp="children"
                                        suffixIcon={<FiChevronDown size={14} />}
                                        popupClassName="custom-select-dropdown"
                                        filterOption={(input, option) =>
                                            (option?.value ?? '').toLowerCase().includes(input.toLowerCase())
                                        }
                                    >
                                        {countries?.map((country) => (
                                            <Option
                                                key={country.id}
                                                value={country.id}
                                                selected={country.countryCode === "IN"}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '14px' }}>{country.countryCode}</span>
                                                    <span style={{ fontSize: '14px' }}>{country.phoneCode}</span>
                                                </div>
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                <Form.Item
                                    name="phone"
                                    noStyle
                                >
                                    <Input
                                        size="large"
                                        type="number"
                                        style={{
                                            flex: 1,
                                            border: 'none',
                                            borderLeft: '1px solid #e6e8eb',
                                            borderRadius: 0,
                                            height: '46px',
                                            backgroundColor: 'transparent'
                                        }}
                                        placeholder="Enter phone number"
                                    />
                                </Form.Item>
                            </Input.Group>
                        </Form.Item>

                        <Form.Item
                            name="address"
                            label={<span style={{ color: "#262626", fontWeight: 500, fontSize: "14px" }}>Address</span>}
                        >
                            <Input.TextArea
                                placeholder="Enter address"
                                style={{
                                    borderRadius: "8px",
                                    border: "1px solid #d9d9d9",
                                    boxShadow: "none",
                                    height: "48px",
                                    fontSize: "14px",
                                    transition: "all 0.3s ease",
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="gender"
                            label={<span style={{ color: "#262626", fontWeight: 500, fontSize: "14px" }}>Gender</span>}
                        >
                            <Select
                                placeholder="Select gender"
                                style={{
                                    width: "100%",
                                    height: "48px",
                                    borderRadius: "8px",
                                }}
                                dropdownStyle={{
                                    borderRadius: "8px",
                                    padding: "8px",
                                }}
                            >
                                <Option value="male">Male</Option>
                                <Option value="female">Female</Option>
                                <Option value="other">Other</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="joiningDate"
                            label={<span style={{ fontSize: '14px', fontWeight: '500' }}>Joining Date</span>}
                            getValueProps={(value) => {
                                return { value: value ? value : null };
                            }}
                        >
                            <DatePicker
                                size="large"
                                format="YYYY-MM-DD"
                                style={{
                                    width: '100%',
                                    borderRadius: '10px',
                                    padding: '8px 16px',
                                    height: '48px',
                                    backgroundColor: '#F8FAFC',
                                    border: '1px solid #E6E8EB',
                                    transition: 'all 0.3s ease',
                                }}
                                placeholder="Select joining date"
                                showToday
                                allowClear
                                inputReadOnly={false}
                                popupStyle={{ zIndex: 1050 }}
                                onChange={(date) => {
                                    if (!date) {
                                        form.setFieldsValue({ joiningDate: null });
                                    }
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="leaveDate"
                            label={<span style={{ fontSize: '14px', fontWeight: '500' }}>Leave Date</span>}
                            dependencies={['joiningDate']}
                            getValueProps={(value) => {
                                return { value: value ? value : null };
                            }}
                            rules={[
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        const joiningDate = getFieldValue('joiningDate');
                                        if (!joiningDate || !value) {
                                            return Promise.resolve();
                                        }
                                        if (value.isAfter(joiningDate)) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Leave date must be after joining date'));
                                    }
                                })
                            ]}
                        >
                            <DatePicker
                                size="large"
                                format="YYYY-MM-DD"
                                style={{
                                    width: '100%',
                                    borderRadius: '10px',
                                    padding: '8px 16px',
                                    height: '48px',
                                    backgroundColor: '#F8FAFC',
                                    border: '1px solid #E6E8EB',
                                    transition: 'all 0.3s ease',
                                }}
                                placeholder="Select leave date"
                                showToday
                                allowClear
                                inputReadOnly={false}
                                popupStyle={{ zIndex: 1050 }}
                                onChange={(date) => {
                                    if (!date) {
                                        form.setFieldsValue({ leaveDate: null });
                                    }
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="branch"
                            label={
                                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                                    Branch
                                </span>
                            }
                        >
                            <Select
                            listHeight={100}
                            dropdownStyle={{
                              Height: '100px',
                              overflowY: 'auto',
                              scrollbarWidth: 'thin',
                              scrollBehavior: 'smooth'
                            }}
                                showSearch
                                placeholder="Select a branch"
                                size="large"
                                dropdownRender={dropdownRender}
                                style={{
                                    width: '100%',
                                    borderRadius: '10px',
                                }}
                                onChange={handleBranchChange}
                                filterOption={(input, option) =>
                                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                }
                            >
                                {branches.map(branch => (
                                    <Option key={branch.id} value={branch.id}>
                                        {branch.branchName}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="department"
                            label={<span style={{ fontSize: '14px', fontWeight: '500' }}>Department</span>}
                        >
                            <Select
                            listHeight={100}
                            dropdownStyle={{
                              Height: '100px',
                              overflowY: 'auto',
                              scrollbarWidth: 'thin',
                              scrollBehavior: 'smooth'
                            }}
                                showSearch
                                placeholder={form.getFieldValue('branch') ? "Select a department" : "Please select a branch first"}
                                size="large"
                                disabled={!form.getFieldValue('branch')}
                                dropdownRender={departmentDropdownRender}
                                style={{
                                    width: '100%',
                                    borderRadius: '10px',
                                }}
                                filterOption={(input, option) =>
                                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                }
                            >
                                {filteredDepartments.map(dept => (
                                    <Option key={dept.id} value={dept.id}>
                                        {dept.department_name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="designation"
                            label={<span style={{ fontSize: '14px', fontWeight: '500' }}>Designation</span>}
                        >
                            <Select
                            listHeight={100}
                            dropdownStyle={{
                              Height: '100px',
                              overflowY: 'auto',
                              scrollbarWidth: 'thin',
                              scrollBehavior: 'smooth'
                            }}
                                showSearch
                                placeholder={form.getFieldValue('branch') ? "Select a designation" : "Please select a branch first"}
                                size="large"
                                disabled={!form.getFieldValue('branch')}
                                dropdownRender={designationDropdownRender}
                                style={{
                                    width: '100%',
                                    borderRadius: '10px',
                                }}
                                filterOption={(input, option) =>
                                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                }
                            >
                                {filteredDesignations.map(desig => (
                                    <Option key={desig.id} value={desig.id}>
                                        {desig.designation_name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                        name="salary_group"
                        label={
                            <span style={{
                                fontSize: '14px',
                                fontWeight: '500',
                            }}>
                                Salary
                            </span>
                        }
                        style={{ flex: 1 }}
                    >
                        <Input.Group compact className="price-input-group" style={{
                            display: 'flex',
                                height: '48px',
                                backgroundColor: '#f8fafc',
                            borderRadius: '10px',
                                border: '1px solid #e6e8eb',
                            overflow: 'hidden',
                            marginBottom: 0
                        }}>
                            <Form.Item
                                name="currency"
                                noStyle
                            >
                                <Select
                                    size="large"
                                    style={{
                                        width: '120px',
                                        height: '48px'
                                    }}
                                    loading={currenciesLoading}
                                    className="currency-select"
                                    dropdownStyle={{
                                        padding: '8px',
                                        borderRadius: '10px',
                                    }}
                                    showSearch
                                    optionFilterProp="children"
                                    suffixIcon={<FiChevronDown size={14} />}
                                    popupClassName="custom-select-dropdown"
                                    filterOption={(input, option) =>
                                        (option?.value ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                >
                                    {currencies?.map((currency) => (
                                        <Option
                                            key={currency.id} 
                                            value={currency.id}
                                            selected={currency.currencyCode === "INR"}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '14px' }}>{currency.currencyIcon}</span>
                                                <span style={{ fontSize: '14px' }}>{currency.currencyCode}</span>
                                            </div>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            <Form.Item
                                name="salary"
                                noStyle
                            >
                                <InputNumber
                                    placeholder="Enter salary"
                                    size="large"
                                    style={{
                                        flex: 1,
                                        width: 'calc(100% - 100px)',
                                        border: 'none',
                                        borderLeft: '1px solid #e6e8eb',
                                        borderRadius: 0,
                                        height: '48px',
                                        padding: '0 16px'
                                    }}
                                    min={0}
                                    precision={2}
                                    className="price-input"
                                />
                            </Form.Item>
                        </Input.Group>
                    </Form.Item>

                        <Form.Item
                            name="accountholder"
                            label={<span style={{ color: "#262626", fontWeight: 500, fontSize: "14px" }}>Account Holder Name</span>}
                        >
                            <Input
                                placeholder="Enter account holder name"
                                style={{
                                    borderRadius: "8px",
                                    border: "1px solid #d9d9d9",
                                    boxShadow: "none",
                                    height: "48px",
                                    fontSize: "14px",
                                    transition: "all 0.3s ease",
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="accountnumber"
                            label={<span style={{ color: "#262626", fontWeight: 500, fontSize: "14px" }}>Account Number</span>}
                        >
                            <Input
                                placeholder="Enter account number"
                                style={{
                                    borderRadius: "8px",
                                    border: "1px solid #d9d9d9",
                                    boxShadow: "none",
                                    height: "48px",
                                    fontSize: "14px",
                                    transition: "all 0.3s ease",
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="bankname"
                            label={<span style={{ color: "#262626", fontWeight: 500, fontSize: "14px" }}>Bank Name</span>}
                        >
                            <Input
                                placeholder="Enter bank name"
                                style={{
                                    borderRadius: "8px",
                                    border: "1px solid #d9d9d9",
                                    boxShadow: "none",
                                    height: "48px",
                                    fontSize: "14px",
                                    transition: "all 0.3s ease",
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="ifsc"
                            label={<span style={{ color: "#262626", fontWeight: 500, fontSize: "14px" }}>IFSC Code</span>}
                        >
                            <Input
                                placeholder="Enter IFSC code"
                                style={{
                                    borderRadius: "8px",
                                    border: "1px solid #d9d9d9",
                                    boxShadow: "none",
                                    height: "48px",
                                    fontSize: "14px",
                                    transition: "all 0.3s ease",
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="banklocation"
                            label={<span style={{ color: "#262626", fontWeight: 500, fontSize: "14px" }}>Bank Location</span>}
                        >
                            <Input
                                placeholder="Enter bank location"
                                style={{
                                    borderRadius: "8px",
                                    border: "1px solid #d9d9d9",
                                    boxShadow: "none",
                                    height: "48px",
                                    fontSize: "14px",
                                    transition: "all 0.3s ease",
                                }}
                            />
                        </Form.Item>
                    </div>

                    <Divider style={{ margin: '24px 0' }} />

                    <Form.Item style={{ marginBottom: 0, marginTop: 32 }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <Button
                                onClick={() => {
                                    form.resetFields();
                                    onCancel();
                                }}
                                style={{
                                    borderRadius: "8px",
                                    border: "1px solid #d9d9d9",
                                    boxShadow: "none",
                                    height: "48px",
                                    padding: "0 24px",
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    transition: "all 0.3s ease",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = "#40a9ff";
                                    e.currentTarget.style.color = "#40a9ff";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = "#d9d9d9";
                                    e.currentTarget.style.color = "rgba(0, 0, 0, 0.88)";
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={isLoading}
                                style={{
                                    borderRadius: "8px",
                                    boxShadow: "none",
                                    height: "48px",
                                    padding: "0 24px",
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                                    border: "none",
                                    transition: "all 0.3s ease",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = "0.85";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = "1";
                                }}
                            >
                                Update Employee
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </div>
        </Modal>

        <CreateBranch 
            open={isCreateBranchModalOpen}
            onCancel={() => setIsCreateBranchModalOpen(false)}
            onSuccess={handleCreateBranchSuccess}
        />
        <CreateDepartment 
            open={isCreateDepartmentModalOpen}
            onCancel={() => setIsCreateDepartmentModalOpen(false)}
            onSuccess={handleCreateDepartmentSuccess}
        />
        <CreateDesignation 
            open={isCreateDesignationModalOpen}
            onCancel={() => setIsCreateDesignationModalOpen(false)}
            onSuccess={handleCreateDesignationSuccess}
        />
        </>
    );
};

export default EditEmployee; 

<style jsx global>{`
  .price-input-group {
    display: flex !important;
    align-items: stretch !important;

    .ant-select {
      .ant-select-selector {
        height: 100% !important;
        border-top-right-radius: 0 !important;
        border-bottom-right-radius: 0 !important;
      }
    }

    .ant-input-number {
      border-top-left-radius: 0 !important;
      border-bottom-left-radius: 0 !important;
    }
  }

  .currency-select {
    cursor: pointer;
    .ant-select-selector {
      padding: 8px 8px !important;
      height: 48px !important;
    }
    
    .ant-select-selection-search {
      input {
        height: 100% !important;
      }
    }

    .ant-select-selection-item {
      padding-right: 20px !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
    }
  }

  .ant-select-dropdown {
    padding: 8px !important;
    border-radius: 10px !important;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08) !important;

    .ant-select-item {
      padding: 8px 12px !important;
      border-radius: 6px !important;
      min-height: 32px !important;
      display: flex !important;
      align-items: center !important;

      &-option-selected {
        background-color: #E6F4FF !important;
        font-weight: 500 !important;
        color: #1890ff !important;
      }

      &-option-active {
        background-color: #F3F4F6 !important;
      }
    }

    .ant-select-item-option-content {
      font-size: 14px !important;
    }
  }

  /* DatePicker styling */
  .ant-picker-dropdown {
    .ant-picker-panel-container {
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08) !important;
      border-radius: 8px !important;
    }
    
    .ant-picker-cell {
      &-in-view {
        color: rgba(0, 0, 0, 0.85) !important;
      }
      
      &-today .ant-picker-cell-inner::before {
        border: 1px solid #1890ff !important;
      }
      
      &-selected .ant-picker-cell-inner {
        background-color: #1890ff !important;
        color: #fff !important;
      }
    }
    
    .ant-picker-today-btn {
      color: #1890ff !important;
    }
  }
  
  .ant-picker {
    width: 100% !important;
    
    .ant-picker-input > input {
      font-size: 14px !important;
    }
  }
`}</style> 
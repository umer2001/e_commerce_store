import { SfInput, SfButton, SfLink, SfModal, useDisclosure, SfLoaderCircular } from '@storefront-ui/react';
import { useFormik } from 'formik';
import { useFrappeAuth } from 'frappe-react-sdk';
import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { getToken } from '../utils/helper';
import * as Yup from 'yup';

export default function Login() {
    const { login } = useUser();
    const [loginState, setLoginState] = useState(true);
    const [apiResponse, setapiResponse] = useState('');
    const [forgotPassword, setForgotPassword] = useState(false)
    const [saveLoading, setSaveLoading] = useState(false)

    const navigate = useNavigate();
    const {
        currentUser,
        isLoading,
        error
    } = useFrappeAuth();

    const getValidationSchema = () => {
        let schema = {};

        schema['usr'] = Yup.string().equals([Yup.ref('usr')], 'enter username').required('จำเป็นต้องกรอกข้อมูล');
        schema['pwd'] = Yup.string().equals([Yup.ref('pwd')], 'Passwords must match').required('จำเป็นต้องกรอกรหัสผ่าน');
        return Yup.object().shape(schema);
    };

    const formik = useFormik({
        initialValues: {
            usr: '',
            pwd: '',
        },
        validationSchema: getValidationSchema(),
        onSubmit: (values) => {
            setSaveLoading(true)
            login(values.usr, values.pwd ).then((data) => {
                if(data.message == 'Logged In' || data.message == 'No App'){
                    navigate("/home/all items")
                } else if(data.message == 'Invalid login credentials'){
                    setapiResponse('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
                    setSaveLoading(false)
                } else {
                    setapiResponse(data.message);
                    setSaveLoading(false)
                }
            });
        }
    });

    useEffect(() => {
        if (getToken() || currentUser) {
            navigate("/home/all items");
        }
        // formik.validateForm();
    }, [ currentUser ]) // Removed 'loginState' because the modal won't show after registered

    const handleForgotPass = (e) => {
        e.preventDefault()
        setForgotPassword(!forgotPassword)
    }

    return (
        <>
        <main className='main-section-login'>
        <h2 className="mb-[85px] text-primary text-center text-4xl font-semibold">เข้าสู่ระบบ</h2>
            <section className={`grid grid-cols-1 gap-[70px] mx-auto lg:grid-cols-2`}>
            <form className="flex gap-4 flex-wrap text-neutral-900 text-start text-big" onSubmit={formik.handleSubmit}>
                <h2 className="text-darkgray text-2xl font-semibold">{forgotPassword ? 'รีเซ็ตรหัสผ่านของคุณ' : 'ลงชื่อเข้าใช้งาน'}</h2>
                {forgotPassword && (
                    <p className='text-secgray'>เราจะส่งข้อมูลไปยังอีเมลของคุณเพื่อรีเซ็ตรหัสผ่าน</p>
                )}

                {apiResponse == 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' && <h2 className="text-xs text-red-500 font-semibold w-full">{apiResponse}</h2>}

                <label className="w-full flex flex-col gap-2">
                    <SfInput name="usr" autoComplete="usr" onChange={formik.handleChange} value={formik.values.usr} 
                        wrapperClassName={`!bg-neutral-50 ${formik.errors.usr ? '!ring-red-500/50' : '!ring-lightgray'} h-[50px] px-6 rounded-xl`}
                        className={`bg-neutral-50 font-medium ${formik.errors.usr ? 'text-red-500' : 'text-darkgray'} `}
                        placeholder='อีเมล *'
                    />
                    <p className='text-red-500 text-xs font-semibold'>{formik.errors.usr}</p>
                </label>

                {!forgotPassword && (
                    <label className="w-full flex flex-col gap-2">
                        <SfInput name="pwd" type='password' autoComplete="given-password" onChange={formik.handleChange} value={formik.values.pwd} 
                            wrapperClassName={`!bg-neutral-50 ${formik.errors.pwd ? '!ring-red-500/50' : '!ring-lightgray'} h-[50px] px-6 rounded-xl`}
                            className={`bg-neutral-50 font-medium ${formik.errors.pwd ? 'text-red-500' : 'text-darkgray'} `}
                            placeholder="รหัสผ่าน *"
                        />
                        <p className='text-red-500 text-xs font-semibold'>{formik.errors.pwd}</p>
                    </label>
                )}

                {forgotPassword ? (
                    <div className="w-full flex mt-6 gap-3">
                        <SfButton variant='tertiary' className={`btn-primary rounded-xl h-[50px] ${loginState === false ? 'w-full' : 'w-[100px]'} ${saveLoading ? '!bg-[#F3F3F3]' : ''}`} type='submit' disabled={saveLoading}>{saveLoading ? <SfLoaderCircular /> : 'ยืนยัน'}</SfButton>
                        <SfButton variant='tertiary' className={`btn-secondary rounded-xl h-[50px] ${loginState === false ? 'w-full' : 'w-[120px]'} ${saveLoading ? '!bg-[#F3F3F3]' : ''}`} onClick={handleForgotPass} disabled={saveLoading}>{saveLoading ? <SfLoaderCircular /> : `ยกเลิก`}</SfButton>
                    </div>
                ) : (
                    <div className="w-full flex mt-6 gap-3">
                        <SfButton variant='tertiary' className={`btn-primary rounded-xl h-[50px] ${loginState === false ? 'w-full' : 'w-[100px]'} ${saveLoading ? '!bg-[#F3F3F3]' : ''}`} type='submit' disabled={saveLoading}>{saveLoading ? <SfLoaderCircular /> : 'เข้าสู่ระบบ'}</SfButton>
                        <SfButton variant='tertiary' className={`btn-secondary rounded-xl h-[50px] ${loginState === false ? 'w-full' : 'w-[120px]'} ${saveLoading ? '!bg-[#F3F3F3]' : ''}`} onClick={handleForgotPass} disabled={saveLoading}>{saveLoading ? <SfLoaderCircular /> : `ลืมรหัสผ่าน`}</SfButton>
                    </div>
                )}
            </form>
            <div className='flex flex-col gap-y-5'>
                <h2 className="text-darkgray text-2xl font-semibold">ลูกค้าใหม่</h2>
                <p className='text-secgray'>ลงทะเบียนเพื่อเข้าถึง การสินค้าสุดพิเศษพร้อมกับสินค้ามาใหม่ เทรนด์ที่มาแรง ส่วนลดและโปรโมชั่นมากมายสำหรับสมาชิก</p>
                <Link to='/register' className='w-fit'>
                    <SfButton className='w-fit mt-5 btn-primary h-[50px] rounded-xl'>
                        สมัครสมาชิก
                    </SfButton>
                </Link>
            </div>
            </section>
        </main>
        </>
    );
}
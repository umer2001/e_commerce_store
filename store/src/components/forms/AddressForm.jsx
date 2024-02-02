import { useEffect, useState } from 'react';
import { SfSelect, SfInput, SfCheckbox, SfButton } from '@storefront-ui/react';
import { useFormik } from 'formik';
import { useFrappePostCall } from 'frappe-react-sdk';
import { addressSchema } from './addressFormSchema';
import { Skeleton } from '../Skeleton';

// Here you should provide a list of countries you want to support
// or use an up-to-date country list like: https://www.npmjs.com/package/country-list
const countries = ['Thailand', 'China', 'Pakistan', 'Germany', 'Great Britain', 'Poland', 'United States of America'];
// const states = ['Sindh', 'Punjab', 'Balochistan', 'KPK', 'Florida', 'New York', 'Texas', 'Frankfurt', 'Berlin'];
const states = ['กรุงเทพมหานคร','กระบี่','กาญจนบุรี','กำแพงเพชร','ขอนแก่น','จันทบุรี','ฉะเชิงเทรา', 'นครปฐม', 'นครพนม', 'นนทบุรี', 'ปทุมธานี', 'พระนครศรีอยุธยา' ,'ชลบุรี','ตราด','ปราจีนบุรี','เพชรบุรี','ราชบุรี','ระยอง','สมุทรปราการ','สมุทรสาคร','สมุทรสงคราม', 'อุดรธานี', 'หนองคาย', 'หนองบัวลำภู', 'อุบลราชธานี', 'อุทัยธานี', 'อ่างทอง']

const AddressForm = ({ onFormSubmit }) => {
    const { call, isCompleted } = useFrappePostCall('headless_e_commerce.api.add_address')
    const [isSaving, setIsSaving] = useState(false)
    const formik = useFormik({
        initialValues: {
            address_title: "",
            phone: "",
            address_line1: "",
            address_line2: "",
            city: "",
            state: "",
            country: "",
            pincode: "",
            is_primary_address: 1,
            is_shipping_address: 0,
        },
        validationSchema: addressSchema,
        validateOnChange: false,
    });

    const CreateNewAddress = (e) => {
        e.preventDefault()
        var form = formik.validateForm()
        formik.validateForm().then((zz) => {
            console.log(zz)
            if (Object.keys(zz).length === 0) {
                setIsSaving(true)
                call(formik.values).then((data) => {
                    onFormSubmit(data);
                    setIsSaving(false)
                 });
            }
        })
        
    }

    return (
        <form className="max-w-[950px] flex gap-3 flex-wrap text-neutral-900">
            {/* <h2 className="w-full typography-headline-4 md:typography-headline-3 font-bold">Billing address</h2> */}
            <div className="w-full flex-grow flex flex-col gap-2">
                <label>
                    {/* <span className="text-sm font-medium mb-2 block">Name <span className='text-red-500'>*</span></span> */}
                    <SfInput
                        name="address_title"
                        wrapperClassName={`!bg-neutral-50 ${formik.errors.address_title ? '!ring-red-500/50 !ring-2' : '!ring-lightgray'} h-[50px] px-6 rounded-xl`}
                        className={`bg-neutral-50 font-medium ${formik.errors.address_title ? 'text-red-500' : 'text-darkgray'} `}
                        onChange={formik.handleChange}
                        value={formik.values.address_title}
                        invalid={formik.errors.address_title}
                        placeholder='ชื่อ-นามสกุล *'
                        disabled={isSaving}
                    />
                </label>
                {formik.errors.address_title && (
                    <strong className="text-xs text-red-500 font-semibold">{formik.errors.address_title}</strong>
                )}
            </div>
            <div className="w-full flex flex-col gap-2">
                <label>
                    {/* <span className="text-sm font-medium mb-2 block">Phone <span className='text-red-500'>*</span></span> */}
                    <SfInput placeholder='เบอร์โทร *' disabled={isSaving} name="phone" 
                    wrapperClassName={`!bg-neutral-50 ${formik.errors.phone ? '!ring-red-500/50 !ring-2' : '!ring-lightgray'} h-[50px] px-6 rounded-xl`}
                    className={`bg-neutral-50 font-medium ${formik.errors.phone ? 'text-red-500' : 'text-darkgray'} `}
                    onChange={formik.handleChange} value={formik.values.phone} />
                </label>
                {formik.errors.phone && (
                    <strong className="text-xs text-red-500 font-semibold">{formik.errors.phone}</strong>
                )}
            </div>
            <div className="w-full flex flex-col gap-2">
                <label>
                    {/* <span className="text-sm font-medium mb-2 block">Country <span className='text-red-500'>*</span></span> */}
                    <SfSelect name="country" className={`h-[50px] ${formik.errors.country ? '!ring-red-500/50 text-red-500 !ring-2' : '!ring-lightgray text-darkgray'} !px-6 !rounded-xl`} disabled={isSaving} wrapperClassName='!bg-neutral-50' placeholder="ประเทศ *" onChange={formik.handleChange} value={formik.values.country} invalid={formik.errors.country}>
                        {countries.map((countryName) => (
                            <option key={countryName} value={countryName}>{countryName}</option>
                        ))}
                    </SfSelect>
                </label>
                {formik.errors.country && (
                    <strong className="text-xs text-red-500 font-semibold">{formik.errors.country}</strong>
                )}
            </div>
            <div className="w-full flex-grow flex flex-col gap-2">
                <label>
                    {/* <span className="text-sm font-medium mb-2 block">Address line 1 <span className='text-red-500'>*</span></span> */}
                    <SfInput
                        name="address_line1"
                        wrapperClassName={`!bg-neutral-50 ${formik.errors.address_line1 ? '!ring-red-500/50 !ring-2' : '!ring-lightgray'} h-[50px] px-6 rounded-xl`}
                        className={`bg-neutral-50 font-medium ${formik.errors.address_line1 ? 'text-red-500' : 'text-darkgray'} `}
                        onChange={formik.handleChange}
                        value={formik.values.address_line1}
                        invalid={formik.errors.address_line1}
                        placeholder='บ้านเลขที่ , ซอย , หมู่ , ถนน *'
                        disabled={isSaving}
                    />
                </label>
                {formik.errors.address_line1 && (
                    <strong className="text-xs text-red-500 font-semibold">{formik.errors.address_line1}</strong>
                )}
            </div>
            <div className="w-full flex flex-col gap-2">
                <label>
                    {/* <span className="text-sm font-medium mb-2 block">Address line 2</span> */}
                    <SfInput name="address_line2" placeholder='แขวง / ตำบล *' 
                    wrapperClassName={`!bg-neutral-50 ${formik.errors.address_line2 ? '!ring-red-500/50 !ring-2' : '!ring-lightgray'} h-[50px] px-6 rounded-xl`}
                    className={`bg-neutral-50 font-medium ${formik.errors.address_line2 ? 'text-red-500' : 'text-darkgray'} `}
                    disabled={isSaving} onChange={formik.handleChange} value={formik.values.address_line2} />
                </label>
                {formik.errors.address_line2 && (
                    <strong className="text-xs text-red-500 font-semibold">{formik.errors.address_line2}</strong>
                )}
            </div>

            <div className="w-full flex flex-col gap-2">
                <label>
                    {/* <span className="text-sm font-medium mb-2 block">City <span className='text-red-500'>*</span></span> */}
                    <SfInput name="city" 
                    wrapperClassName={`!bg-neutral-50 ${formik.errors.city ? '!ring-red-500/50 !ring-2' : '!ring-lightgray'} h-[50px] px-6 rounded-xl`}
                    className={`bg-neutral-50 font-medium ${formik.errors.city ? 'text-red-500' : 'text-darkgray'} `}
                    disabled={isSaving} placeholder="เขต / อำเภอ *" onChange={formik.handleChange} value={formik.values.city} invalid={formik.errors.city} />
                </label>
                {formik.errors.city && (
                    <strong className="text-xs text-red-500 font-semibold">{formik.errors.city}</strong>
                )}
            </div>

            <div className='w-full flex flex-col gap-3 md:flex-row md:justify-between'>
                <label className="w-full flex flex-col gap-2 flex-grow">
                    {/* <span className="text-sm font-medium mb-2 block">State</span> */}
                    <SfSelect name="state" className={`h-[50px] ${formik.errors.state ? '!ring-red-500/50 text-red-500 !ring-2' : '!ring-lightgray text-darkgray'} !px-6 !rounded-xl`} disabled={isSaving} wrapperClassName='!bg-neutral-50' placeholder="จังหวัด *" onChange={formik.handleChange} value={formik.values.state}>
                        {states.map((stateName) => (
                            <option key={stateName} value={stateName}>{stateName}</option>
                        ))}
                    </SfSelect>
                    {formik.errors.state && (
                        <strong className="text-xs text-red-500 font-semibold">{formik.errors.state}</strong>
                    )}
                </label>
                <div className="w-full flex flex-col gap-2">
                    <label>
                        {/* <span className="text-sm font-medium mb-2 block">Postal code</span> */}
                        <SfInput name="pincode" 
                        wrapperClassName={`!bg-neutral-50 ${formik.errors.pincode ? '!ring-red-500/50 !ring-2' : '!ring-lightgray'} h-[50px] px-6 rounded-xl`}
                        className={`bg-neutral-50 font-medium ${formik.errors.pincode ? 'text-red-500' : 'text-darkgray'} `}
                        disabled={isSaving} 
                        placeholder='รหัสไปรษณีย์ *' onChange={formik.handleChange} value={formik.values.pincode} />
                    </label>
                    {formik.errors.pincode && (
                        <strong className="text-xs text-red-500 font-semibold">{formik.errors.pincode}</strong>
                    )}
                </div>
            </div>

            {/* <label className="w-full flex items-center gap-2">
                <SfCheckbox
                    name="is_shipping_address"
                    onChange={e => formik.setFieldValue('is_shipping_address', e.target.checked ? 1 : 0)}
                    checked={formik.values.is_shipping_address === 1 ? true : false} />
                Use as shipping address
            </label> */}

            <div className="w-full flex gap-3 mt-3">
                {/* <SfButton type="reset" variant='tertiary' className="w-full md:w-auto btn-secondary text-sm" onClick={formik.handleReset}>
                    Clear all
                </SfButton> */}

                {!isSaving ? <SfButton  className="w-full h-[50px] btn-primary text-base rounded-xl" onClick={CreateNewAddress}>ยืนยันที่อยู่</SfButton> : <Skeleton className='h-[50px] w-full'/>}
            </div>
        </form>
    )
}

export default AddressForm;
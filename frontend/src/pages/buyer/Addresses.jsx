/**
 * Addresses Page (Buyer)
 * Manage delivery addresses
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import useFormValidation from '../../hooks/useFormValidation';
import { validateRequired, validatePhone, validateZipCode } from '../../utils/validation';

const Addresses = () => {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Validation schema
  const validationSchema = {
    fullName: (value) => validateRequired(value, 'Full Name'),
    phone: (value) => validatePhone(value, true),
    street: (value) => validateRequired(value, 'Street Address'),
    city: (value) => validateRequired(value, 'City'),
    state: (value) => validateRequired(value, 'State'),
    zipCode: (value) => validateZipCode(value, true),
    country: (value) => validateRequired(value, 'Country'),
  };

  // Form validation hook
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    isValid
  } = useFormValidation(
    {
      fullName: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
      isDefault: false
    },
    validationSchema
  );

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/buyer/addresses');
      setAddresses(response.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = () => {
    resetForm();
    setEditingAddress(null);
    setShowAddModal(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setFieldValue('fullName', address.fullName);
    setFieldValue('phone', address.phone);
    setFieldValue('street', address.street);
    setFieldValue('city', address.city);
    setFieldValue('state', address.state);
    setFieldValue('zipCode', address.zipCode);
    setFieldValue('country', address.country || 'United States');
    setFieldValue('isDefault', address.isDefault || false);
    setShowAddModal(true);
  };

  const onSubmitAddress = async (formData) => {
    try {
      if (editingAddress) {
        await api.put(`/api/buyer/addresses/${editingAddress._id}`, formData);
      } else {
        await api.post('/buyer/addresses', formData);
      }
      
      setShowAddModal(false);
      fetchAddresses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save address');
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      await api.put(`/api/buyer/addresses/${addressId}/default`);
      fetchAddresses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set default address');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      await api.delete(`/api/buyer/addresses/${addressId}`);
      setDeleteConfirm(null);
      fetchAddresses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete address');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Delivery Addresses</h1>
            <p className="text-gray-600 mt-2">Manage your shipping addresses</p>
          </div>
          <button
            onClick={handleAddAddress}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Add New Address
          </button>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} />
          </div>
        )}

        {/* Addresses Grid */}
        {addresses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No addresses yet</h3>
            <p className="text-gray-600 mb-4">Add your first delivery address to start shopping</p>
            <button
              onClick={handleAddAddress}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Add Address
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addresses.map((address) => (
              <div
                key={address._id}
                className={`bg-white rounded-lg shadow-sm p-6 border-2 ${
                  address.isDefault ? 'border-blue-500' : 'border-transparent'
                } hover:shadow-md transition-shadow`}
              >
                {address.isDefault && (
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded mb-3">
                    DEFAULT
                  </span>
                )}
                
                <h3 className="font-semibold text-gray-900 mb-2">{address.fullName}</h3>
                <p className="text-gray-600 text-sm mb-1">{address.phone}</p>
                <p className="text-gray-600 text-sm">{address.street}</p>
                <p className="text-gray-600 text-sm">
                  {address.city}, {address.state} {address.zipCode}
                </p>
                <p className="text-gray-600 text-sm mb-4">{address.country}</p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditAddress(address)}
                    className="flex-1 text-blue-600 hover:text-blue-700 font-semibold text-sm py-2 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Edit
                  </button>
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address._id)}
                      className="flex-1 text-gray-600 hover:text-gray-700 font-semibold text-sm py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteConfirm(address)}
                    className="text-red-600 hover:text-red-700 font-semibold text-sm py-2 px-3 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Address Modal */}
        {showAddModal && (
          <Modal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            title={editingAddress ? 'Edit Address' : 'Add New Address'}
          >
            <form onSubmit={handleSubmit(onSubmitAddress)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={values.fullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border ${
                    touched.fullName && errors.fullName
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  } rounded-md focus:outline-none focus:ring-2`}
                />
                {touched.fullName && errors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={values.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border ${
                    touched.phone && errors.phone
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  } rounded-md focus:outline-none focus:ring-2`}
                />
                {touched.phone && errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="street"
                  value={values.street}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border ${
                    touched.street && errors.street
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  } rounded-md focus:outline-none focus:ring-2`}
                />
                {touched.street && errors.street && (
                  <p className="text-red-500 text-sm mt-1">{errors.street}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={values.city}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-3 py-2 border ${
                      touched.city && errors.city
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    } rounded-md focus:outline-none focus:ring-2`}
                  />
                  {touched.city && errors.city && (
                    <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={values.state}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-3 py-2 border ${
                      touched.state && errors.state
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    } rounded-md focus:outline-none focus:ring-2`}
                  />
                  {touched.state && errors.state && (
                    <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={values.zipCode}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-3 py-2 border ${
                      touched.zipCode && errors.zipCode
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    } rounded-md focus:outline-none focus:ring-2`}
                  />
                  {touched.zipCode && errors.zipCode && (
                    <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={values.country}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  name="isDefault"
                  checked={values.isDefault}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                  Set as default address
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !isValid}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : editingAddress ? 'Update Address' : 'Add Address'}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirm && (
          <ConfirmDialog
            isOpen={!!deleteConfirm}
            onClose={() => setDeleteConfirm(null)}
            onConfirm={() => handleDeleteAddress(deleteConfirm._id)}
            title="Delete Address"
            message={`Are you sure you want to delete the address for ${deleteConfirm.fullName}? This action cannot be undone.`}
            confirmText="Delete"
            confirmButtonClass="bg-red-600 hover:bg-red-700"
          />
        )}
      </div>
    </div>
  );
};

export default Addresses;

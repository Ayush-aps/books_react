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
import { useToast } from '../../components/Toast';
// Removed: useFormValidation and manual validation utils

// RHF Imports
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addressSchema } from '../../schemas/allFormSchemas';

const Addresses = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isValid }
  } = useForm({
    resolver: zodResolver(addressSchema),
    mode: 'onTouched',
    defaultValues: {
      fullName: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
      isDefault: false
    }
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/buyer/addresses');
      setAddresses(response.data.data.addresses || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    reset({
      fullName: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
      isDefault: false
    });
    setShowAddModal(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    // Map address data to form fields
    reset({
      fullName: address.name || address.fullName,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country || 'United States',
      isDefault: address.isDefault || false
    });
    setShowAddModal(true);
  };

  const onSubmitAddress = async (data) => {
    try {
      if (editingAddress) {
        await api.put(`/buyer/addresses/${editingAddress._id}`, data);
      } else {
        await api.post('/buyer/addresses', data);
      }

      setShowAddModal(false);
      fetchAddresses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save address');
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      await api.put(`/buyer/addresses/${addressId}`, { isDefault: true });
      toast.success('Default address updated successfully!', 3000);
      fetchAddresses();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to set default address';
      setError(errorMessage);
      toast.error(errorMessage, 3000);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      await api.delete(`/buyer/addresses/${addressId}`);
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
    <div className="min-h-screen bg-background-primary py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Delivery Addresses</h1>
            <p className="text-text-secondary mt-2">Manage your shipping addresses</p>
          </div>
          <button
            onClick={handleAddAddress}
            className="bg-accent-brown text-white px-6 py-3 rounded-lg font-semibold hover:bg-accent-brown/90 transition-colors shadow-sm"
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
          <div className="bg-background-secondary rounded-lg shadow-sm p-12 text-center border border-border-primary">
            <svg
              className="w-16 h-16 text-text-tertiary mx-auto mb-4"
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
            <h3 className="text-lg font-semibold text-text-primary mb-2">No addresses yet</h3>
            <p className="text-text-secondary mb-4">Add your first delivery address to start shopping</p>
            <button
              onClick={handleAddAddress}
              className="bg-accent-brown text-white px-6 py-2 rounded-lg font-semibold hover:bg-accent-brown/90 transition-colors"
            >
              Add Address
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addresses.map((address) => (
              <div
                key={address._id}
                className={`bg-background-secondary rounded-xl shadow-sm p-6 border ${
                  address.isDefault ? 'border-accent-brown ring-2 ring-accent-brown/20' : 'border-border-primary'
                } hover:shadow-lg hover:scale-[1.02] transition-all duration-300 ease-in-out flex flex-col h-full`}
              >
                {address.isDefault && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-accent-brown to-accent-brown/90 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      DEFAULT
                    </span>
                  </div>
                )}

                <div className="flex-grow">
                  <div className="space-y-2 mb-5">
                    <h3 className="font-semibold text-text-primary">{address.name || address.fullName}</h3>
                    <div className="space-y-1 text-sm text-text-secondary">
                      <p className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-text-tertiary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {address.phone}
                      </p>
                      <p className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-text-tertiary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>
                          {address.street}<br />
                          {address.city}, {address.state} {address.zipCode}<br />
                          {address.country}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-border-primary mt-auto">
                  <button
                    onClick={() => handleEditAddress(address)}
                    className="flex-1 flex items-center justify-center gap-1.5 font-medium text-sm py-2.5 px-3 rounded-lg transition-all duration-200 shadow-sm text-accent-brown bg-accent-brown/10 hover:text-white hover:bg-accent-brown hover:shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  {!address.isDefault ? (
                    <button
                      onClick={() => handleSetDefault(address._id)}
                      className="flex-1 flex items-center justify-center gap-1.5 font-medium text-sm py-2.5 px-3 rounded-lg transition-all duration-200 shadow-sm text-accent-green bg-accent-green/10 hover:text-white hover:bg-accent-green hover:shadow-md"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Default
                    </button>
                  ) : (
                    <div className="flex-1"></div>
                  )}
                  <button
                    onClick={() => setDeleteConfirm(address)}
                    className="flex items-center justify-center gap-1.5 font-medium text-sm py-2.5 px-3 rounded-lg transition-all duration-200 shadow-sm text-error bg-error/10 hover:text-white hover:bg-error hover:shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
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
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Full Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  {...register("fullName")}
                  className={`w-full px-3 py-2 border ${errors.fullName
                    ? 'border-error focus:ring-error'
                    : 'border-border-primary focus:ring-accent-brown'
                    } rounded-md focus:outline-none focus:ring-2 bg-background-secondary text-text-primary`}
                />
                {errors.fullName && (
                  <p className="text-error text-sm mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Phone Number <span className="text-error">*</span>
                </label>
                <input
                  type="tel"
                  {...register("phone")}
                  className={`w-full px-3 py-2 border ${errors.phone
                    ? 'border-error focus:ring-error'
                    : 'border-border-primary focus:ring-accent-brown'
                    } rounded-md focus:outline-none focus:ring-2 bg-background-secondary text-text-primary`}
                />
                {errors.phone && (
                  <p className="text-error text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Street Address <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  {...register("street")}
                  className={`w-full px-3 py-2 border ${errors.street
                    ? 'border-error focus:ring-error'
                    : 'border-border-primary focus:ring-accent-brown'
                    } rounded-md focus:outline-none focus:ring-2`}
                />
                {errors.street && (
                  <p className="text-error text-sm mt-1">{errors.street.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    City <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("city")}
                    className={`w-full px-3 py-2 border ${errors.city
                      ? 'border-error focus:ring-error'
                      : 'border-border-primary focus:ring-accent-brown'
                      } rounded-md focus:outline-none focus:ring-2`}
                  />
                  {errors.city && (
                    <p className="text-error text-sm mt-1">{errors.city.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    State <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("state")}
                    className={`w-full px-3 py-2 border ${errors.state
                      ? 'border-error focus:ring-error'
                      : 'border-border-primary focus:ring-accent-brown'
                      } rounded-md focus:outline-none focus:ring-2`}
                  />
                  {errors.state && (
                    <p className="text-error text-sm mt-1">{errors.state.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    ZIP Code <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("zipCode")}
                    className={`w-full px-3 py-2 border ${errors.zipCode
                      ? 'border-error focus:ring-error'
                      : 'border-border-primary focus:ring-accent-brown'
                      } rounded-md focus:outline-none focus:ring-2`}
                  />
                  {errors.zipCode && (
                    <p className="text-error text-sm mt-1">{errors.zipCode.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Country <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("country")}
                    className={`w-full px-3 py-2 border ${errors.country
                      ? 'border-error focus:ring-error'
                      : 'border-border-primary focus:ring-accent-brown'
                      } rounded-md focus:outline-none focus:ring-2`}
                  />
                  {errors.country && (
                    <p className="text-error text-sm mt-1">{errors.country.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  {...register("isDefault")}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isDefault" className="ml-2 text-sm text-text-primary">
                  Set as default address
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-text-primary font-semibold hover:bg-gray-50 disabled:opacity-50"
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

import { useState } from 'react';import { useState } from 'react';

import { useNavigate } from 'react-router-dom';import { useNavigate } from 'react-router-dom';

import { sellerService } from '../../services/sellerService';import { sellerService } from '../../services/sellerService';

import LoadingSpinner from '../../components/LoadingSpinner';import LoadingSpinner from '../../components/LoadingSpinner';

import ErrorMessage from '../../components/ErrorMessage';import ErrorMessage from '../../components/ErrorMessage';

import useFormValidation from '../../hooks/useFormValidation';import useFormValidation from '../../hooks/useFormValidation';

import { validateRequired, validateNumber, validateURL, validateISBN, validateYear } from '../../utils/validation';import { validateRequired, validateNumber, validateURL, validateISBN, validateYear } from '../../utils/validation';

import Button from '../../components/Button';import Button from '../../components/Button';

import Card from '../../components/Card';import Card from '../../components/Card';

import Input from '../../components/Input';import Input from '../../components/Input';

import { motion } from 'framer-motion';import { motion } from 'framer-motion';

import { fadeInUp, staggerContainer, staggerItem } from '../../utils/animations';import { fadeInUp, staggerContainer, staggerItem } from '../../utils/animations';



const UploadBook = () => {const UploadBook = () => {

  const navigate = useNavigate();  const navigate = useNavigate();

  const [error, setError] = useState(null);  const [error, setError] = useState(null);



  const genres = [  const genres = [

    'Fiction', 'Non-Fiction', 'Mystery', 'Thriller', 'Romance', 'Science Fiction',    'Fiction', 'Non-Fiction', 'Mystery', 'Thriller', 'Romance', 'Science Fiction',

    'Fantasy', 'Biography', 'History', 'Self-Help', 'Business', 'Poetry',    'Fantasy', 'Biography', 'History', 'Self-Help', 'Business', 'Poetry',

    'Horror', 'Adventure', 'Young Adult', 'Children', 'Comics', 'Other'    'Horror', 'Adventure', 'Young Adult', 'Children', 'Comics', 'Other'

  ];  ];



  const validationSchema = {  const validationSchema = {

    title: (value) => validateRequired(value, 'Book Title'),    title: (value) => validateRequired(value, 'Book Title'),

    author: (value) => validateRequired(value, 'Author'),    author: (value) => validateRequired(value, 'Author'),

    genre: (value) => validateRequired(value, 'Genre'),    genre: (value) => validateRequired(value, 'Genre'),

    price: (value) => validateNumber(value, 0.01, undefined, 'Price'),    price: (value) => validateNumber(value, 0.01, undefined, 'Price'),

    discountPercentage: (value) => {    discountPercentage: (value) => {

      if (!value) return { isValid: true, error: '' };      if (!value) return { isValid: true, error: '' };

      return validateNumber(value, 0, 100, 'Discount Percentage');      return validateNumber(value, 0, 100, 'Discount Percentage');

    },    },

    stock: (value) => validateNumber(value, 0, undefined, 'Stock Quantity'),    stock: (value) => validateNumber(value, 0, undefined, 'Stock Quantity'),

    isbn: (value) => validateISBN(value, false),    isbn: (value) => validateISBN(value, false),

    publicationYear: (value) => validateYear(value, false),    publicationYear: (value) => validateYear(value, false),

    coverImage: (value) => validateURL(value, false),    coverImage: (value) => validateURL(value, false),

  };  };



  const {  const {

    values,    values,

    errors,    errors,

    touched,    touched,

    isSubmitting,    isSubmitting,

    handleChange,    handleChange,

    handleBlur,    handleBlur,

    handleSubmit,    handleSubmit,

    isValid    isValid

  } = useFormValidation(  } = useFormValidation(

    {    {

      title: '',      title: '',

      author: '',      author: '',

      genre: '',      genre: '',

      price: '',      price: '',

      discountPercentage: '',      discountPercentage: '',

      stock: '',      stock: '',

      condition: 'new',      condition: 'new',

      description: '',      description: '',

      isbn: '',      isbn: '',

      publicationYear: '',      publicationYear: '',

      coverImage: ''      coverImage: ''

    },    },

    validationSchema    validationSchema

  );  );



  const onSubmit = async (formData) => {  const onSubmit = async (formData) => {

    setError(null);    setError(null);



    try {    try {

      const bookData = {      const bookData = {

        ...formData,        ...formData,

        price: parseFloat(formData.price),        price: parseFloat(formData.price),

        stock: parseInt(formData.stock),        stock: parseInt(formData.stock),

        discountPercentage: formData.discountPercentage ? parseFloat(formData.discountPercentage) : 0,        discountPercentage: formData.discountPercentage ? parseFloat(formData.discountPercentage) : 0,

        publicationYear: formData.publicationYear ? parseInt(formData.publicationYear) : undefined        publicationYear: formData.publicationYear ? parseInt(formData.publicationYear) : undefined

      };      };



      await sellerService.uploadBook(bookData);      await sellerService.uploadBook(bookData);

      navigate('/seller/inventory', { state: { success: 'Book uploaded successfully!' } });      navigate('/seller/inventory', { state: { success: 'Book uploaded successfully!' } });

    } catch (err) {    } catch (err) {

      setError(err.response?.data?.message || 'Failed to upload book');      setError(err.response?.data?.message || 'Failed to upload book');

    }    }

  };  };



  return (  return (

    <div className="min-h-screen bg-cream py-12">    <div className="min-h-screen bg-cream py-12">

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div         {/* Header */}

          className="mb-12"        <motion.div 

          variants={fadeInUp}          className="mb-12"

          initial="hidden"          variants={fadeInUp}

          animate="visible"          initial="hidden"

        >          animate="visible"

          <h1 className="heading-1 text-charcoal mb-2">Upload New Book</h1>        >

          <p className="body text-charcoal/70">Add a new book to your inventory</p>          <h1 className="heading-1 text-charcoal mb-2">Upload New Book</h1>

        </motion.div>          <p className="body text-charcoal/70">Add a new book to your inventory</p>

        </motion.div>

        {error && (

          <motion.div         {error && (

            className="mb-6"          <motion.div 

            variants={fadeInUp}            className="mb-6"

            initial="hidden"            variants={fadeInUp}

            animate="visible"            initial="hidden"

          >            animate="visible"

            <ErrorMessage message={error} />          >

          </motion.div>            <ErrorMessage message={error} />

        )}          </motion.div>

        )}

        <motion.form 

          onSubmit={handleSubmit(onSubmit)}        {/* Form */}

          variants={staggerContainer}        <motion.form 

          initial="hidden"          onSubmit={handleSubmit(onSubmit)}

          animate="visible"          variants={staggerContainer}

          className="space-y-6"          initial="hidden"

        >          animate="visible"

          <motion.div variants={staggerItem}>          className="space-y-6"

            <Card>        >

              <Card.Header>          {/* Basic Information */}

                <div className="flex items-center gap-3">          <motion.div variants={staggerItem}>

                  <div className="w-10 h-10 rounded-full bg-brown/10 flex items-center justify-center">            <Card>

                    <svg className="w-5 h-5 text-brown" fill="none" viewBox="0 0 24 24" stroke="currentColor">              <Card.Header>

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />                <div className="flex items-center gap-3">

                    </svg>                  <div className="w-10 h-10 rounded-full bg-brown/10 flex items-center justify-center">

                  </div>                    <svg className="w-5 h-5 text-brown" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                  <h2 className="heading-3 text-charcoal">Basic Information</h2>                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />

                </div>                    </svg>

              </Card.Header>                  </div>

              <Card.Body>                  <h2 className="heading-3 text-charcoal">Basic Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">                </div>

                  <div className="md:col-span-2">              </Card.Header>

                    <Input              <Card.Body>

                      label="Book Title"                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      type="text"                  <div className="md:col-span-2">

                      id="title"                    <Input

                      name="title"                      label="Book Title"

                      value={values.title}                      type="text"

                      onChange={handleChange}                      id="title"

                      onBlur={handleBlur}                      name="title"

                      error={touched.title ? errors.title : ''}                      value={values.title}

                      placeholder="Enter book title"                      onChange={handleChange}

                      required                      onBlur={handleBlur}

                    />                      error={touched.title ? errors.title : ''}

                  </div>                      placeholder="Enter book title"

                      required

                  <Input                    />

                    label="Author"                  </div>

                    type="text"

                    id="author"                  <Input

                    name="author"                    label="Author"

                    value={values.author}                    type="text"

                    onChange={handleChange}                    id="author"

                    onBlur={handleBlur}                    name="author"

                    error={touched.author ? errors.author : ''}                    value={values.author}

                    placeholder="Author name"                    onChange={handleChange}

                    required                    onBlur={handleBlur}

                  />                    error={touched.author ? errors.author : ''}

                    placeholder="Author name"

                  <Input.Select                    required

                    label="Genre"                  />

                    id="genre"

                    name="genre"                  <Input.Select

                    value={values.genre}                    label="Genre"

                    onChange={handleChange}                    id="genre"

                    onBlur={handleBlur}                    name="genre"

                    error={touched.genre ? errors.genre : ''}                    value={values.genre}

                    required                    onChange={handleChange}

                  >                    onBlur={handleBlur}

                    <option value="">Select genre</option>                    error={touched.genre ? errors.genre : ''}

                    {genres.map(genre => (                    required

                      <option key={genre} value={genre}>{genre}</option>                  >

                    ))}                    <option value="">Select genre</option>

                  </Input.Select>                    {genres.map(genre => (

                      <option key={genre} value={genre}>{genre}</option>

                  <Input                    ))}

                    label="ISBN"                  </Input.Select>

                    type="text"

                    id="isbn"                  <Input

                    name="isbn"                    label="ISBN"

                    value={values.isbn}                    type="text"

                    onChange={handleChange}                    id="isbn"

                    onBlur={handleBlur}                    name="isbn"

                    error={touched.isbn ? errors.isbn : ''}                    value={values.isbn}

                    placeholder="10 or 13 digit ISBN"                    onChange={handleChange}

                  />                    onBlur={handleBlur}

                    error={touched.isbn ? errors.isbn : ''}

                  <Input                    placeholder="10 or 13 digit ISBN"

                    label="Publication Year"                  />

                    type="number"

                    id="publicationYear"                  <Input

                    name="publicationYear"                    label="Publication Year"

                    value={values.publicationYear}                    type="number"

                    onChange={handleChange}                    id="publicationYear"

                    onBlur={handleBlur}                    name="publicationYear"

                    error={touched.publicationYear ? errors.publicationYear : ''}                    value={values.publicationYear}

                    placeholder="YYYY"                    onChange={handleChange}

                    min="1800"                    onBlur={handleBlur}

                    max={new Date().getFullYear()}                    error={touched.publicationYear ? errors.publicationYear : ''}

                  />                    placeholder="YYYY"

                </div>                    min="1800"

              </Card.Body>                    max={new Date().getFullYear()}

            </Card>                  />

          </motion.div>                </div>

              </Card.Body>

          <motion.div variants={staggerItem}>            </Card>

            <Card>          </motion.div>

              <Card.Header>

                <div className="flex items-center gap-3">          {/* Pricing & Inventory */}

                  <div className="w-10 h-10 rounded-full bg-green/10 flex items-center justify-center">          <motion.div variants={staggerItem}>

                    <svg className="w-5 h-5 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">            <Card>

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />              <Card.Header>

                    </svg>                <div className="flex items-center gap-3">

                  </div>                  <div className="w-10 h-10 rounded-full bg-green/10 flex items-center justify-center">

                  <h2 className="heading-3 text-charcoal">Pricing & Inventory</h2>                    <svg className="w-5 h-5 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                </div>                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />

              </Card.Header>                    </svg>

              <Card.Body>                  </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">                  <h2 className="heading-3 text-charcoal">Pricing & Inventory</h2>

                  <Input                </div>

                    label="Price (₹)"              </Card.Header>

                    type="number"              <Card.Body>

                    id="price"                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    name="price"                  <Input

                    value={values.price}                    label="Price (₹)"

                    onChange={handleChange}                    type="number"

                    onBlur={handleBlur}                    id="price"

                    error={touched.price ? errors.price : ''}                    name="price"

                    placeholder="0.00"                    value={values.price}

                    min="0"                    onChange={handleChange}

                    step="0.01"                    onBlur={handleBlur}

                    required                    error={touched.price ? errors.price : ''}

                  />                    placeholder="0.00"

                    min="0"

                  <Input                    step="0.01"

                    label="Discount (%)"                    required

                    type="number"                  />

                    id="discountPercentage"

                    name="discountPercentage"                  <Input

                    value={values.discountPercentage}                    label="Discount (%)"

                    onChange={handleChange}                    type="number"

                    onBlur={handleBlur}                    id="discountPercentage"

                    error={touched.discountPercentage ? errors.discountPercentage : ''}                    name="discountPercentage"

                    placeholder="0"                    value={values.discountPercentage}

                    min="0"                    onChange={handleChange}

                    max="100"                    onBlur={handleBlur}

                  />                    error={touched.discountPercentage ? errors.discountPercentage : ''}

                    placeholder="0"

                  <Input                    min="0"

                    label="Stock Quantity"                    max="100"

                    type="number"                  />

                    id="stock"

                    name="stock"                  <Input

                    value={values.stock}                    label="Stock Quantity"

                    onChange={handleChange}                    type="number"

                    onBlur={handleBlur}                    id="stock"

                    error={touched.stock ? errors.stock : ''}                    name="stock"

                    placeholder="0"                    value={values.stock}

                    min="0"                    onChange={handleChange}

                    required                    onBlur={handleBlur}

                  />                    error={touched.stock ? errors.stock : ''}

                </div>                    placeholder="0"

              </Card.Body>                    min="0"

            </Card>                    required

          </motion.div>                  />

                </div>

          <motion.div variants={staggerItem}>              </Card.Body>

            <Card>            </Card>

              <Card.Header>          </motion.div>

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-full bg-taupe/20 flex items-center justify-center">          {/* Book Details */}

                    <svg className="w-5 h-5 text-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor">          <motion.div variants={staggerItem}>

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />            <Card>

                    </svg>              <Card.Header>

                  </div>                <div className="flex items-center gap-3">

                  <h2 className="heading-3 text-charcoal">Book Details</h2>                  <div className="w-10 h-10 rounded-full bg-taupe/20 flex items-center justify-center">

                </div>                    <svg className="w-5 h-5 text-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor">

              </Card.Header>                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />

              <Card.Body>                    </svg>

                <div className="space-y-6">                  </div>

                  <Input.Select                  <h2 className="heading-3 text-charcoal">Book Details</h2>

                    label="Condition"                </div>

                    id="condition"              </Card.Header>

                    name="condition"              <Card.Body>

                    value={values.condition}                <div className="space-y-6">

                    onChange={handleChange}                  <Input.Select

                    required                    label="Condition"

                  >                    id="condition"

                    <option value="new">New</option>                    name="condition"

                    <option value="used">Used</option>                    value={values.condition}

                  </Input.Select>                    onChange={handleChange}

                    required

                  <Input.Textarea                  >

                    label="Description"                    <option value="new">New</option>

                    id="description"                    <option value="used">Used</option>

                    name="description"                  </Input.Select>

                    value={values.description}

                    onChange={handleChange}                  <Input.Textarea

                    rows={5}                    label="Description"

                    placeholder="Provide a detailed description of the book..."                    id="description"

                  />                    name="description"

                    value={values.description}

                  <Input                    onChange={handleChange}

                    label="Cover Image URL"                    rows={5}

                    type="url"                    placeholder="Provide a detailed description of the book..."

                    id="coverImage"                  />

                    name="coverImage"

                    value={values.coverImage}                  <Input

                    onChange={handleChange}                    label="Cover Image URL"

                    onBlur={handleBlur}                    type="url"

                    error={touched.coverImage ? errors.coverImage : ''}                    id="coverImage"

                    placeholder="https://example.com/cover.jpg"                    name="coverImage"

                    helpText="Enter a direct URL to the book cover image"                    value={values.coverImage}

                  />                    onChange={handleChange}

                </div>                    onBlur={handleBlur}

              </Card.Body>                    error={touched.coverImage ? errors.coverImage : ''}

            </Card>                    placeholder="https://example.com/cover.jpg"

          </motion.div>                    helpText="Enter a direct URL to the book cover image"

                  />

          <motion.div variants={staggerItem}>                </div>

            <Card className="border-2 border-brown/20 bg-brown/5">              </Card.Body>

              <Card.Body>            </Card>

                <div className="flex gap-3">          </motion.div>

                  <div className="w-6 h-6 rounded-full bg-brown/20 flex items-center justify-center flex-shrink-0 mt-0.5">

                    <svg className="w-4 h-4 text-brown" fill="currentColor" viewBox="0 0 20 20">          {/* Note Card */}

                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />          <motion.div variants={staggerItem}>

                    </svg>            <Card className="border-2 border-brown/20 bg-brown/5">

                  </div>              <Card.Body>

                  <div>                <div className="flex gap-3">

                    <p className="body text-charcoal/80">                  <div className="w-6 h-6 rounded-full bg-brown/20 flex items-center justify-center flex-shrink-0 mt-0.5">

                      <strong className="text-charcoal">Note:</strong> Your book will be submitted for admin approval before it appears in the marketplace.                    <svg className="w-4 h-4 text-brown" fill="currentColor" viewBox="0 0 20 20">

                    </p>                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />

                  </div>                    </svg>

                </div>                  </div>

              </Card.Body>                  <div>

            </Card>                    <p className="body text-charcoal/80">

          </motion.div>                      <strong className="text-charcoal">Note:</strong> Your book will be submitted for admin approval before it appears in the marketplace.

                    </p>

          <motion.div                   </div>

            className="flex flex-col sm:flex-row gap-4"                </div>

            variants={staggerItem}              </Card.Body>

          >            </Card>

            <Button          </motion.div>

              type="button"

              variant="outline"          {/* Submit Buttons */}

              size="lg"          <motion.div 

              onClick={() => navigate('/seller/inventory')}            className="flex flex-col sm:flex-row gap-4"

              disabled={isSubmitting}            variants={staggerItem}

            >          >

              Cancel            <Button

            </Button>              type="button"

            <Button              variant="outline"

              type="submit"              size="lg"

              variant="primary"              onClick={() => navigate('/seller/inventory')}

              size="lg"              disabled={isSubmitting}

              fullWidth            >

              disabled={isSubmitting || !isValid}              Cancel

              loading={isSubmitting}            </Button>

            >            <Button

              {isSubmitting ? 'Uploading...' : 'Upload Book'}              type="submit"

            </Button>              variant="primary"

          </motion.div>              size="lg"

        </motion.form>              fullWidth

      </div>              disabled={isSubmitting || !isValid}

    </div>              loading={isSubmitting}

  );            >

};              {isSubmitting ? 'Uploading...' : 'Upload Book'}

            </Button>

export default UploadBook;          </motion.div>

        </motion.form>
      </div>
    </div>
  );
};

export default UploadBook;

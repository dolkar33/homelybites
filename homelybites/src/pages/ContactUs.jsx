import React, { useState, useEffect } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BackButton from "../components/BackButton";

// Yup validation schema - email is now optional since it's auto-populated
const validationSchema = yup.object({
  name: yup
    .string()
    .required("Full name is required")
    .min(2, "Name must be at least 2 characters")
    .matches(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email address"),
  subject: yup
    .string()
    .required("Subject is required")
    .min(5, "Subject must be at least 5 characters")
    .max(100, "Subject must be less than 100 characters"),
  message: yup
    .string()
    .required("Message is required")
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message must be less than 1000 characters"),
});

const ContactPage = () => {
  const [status, setStatus] = useState({ type: "", message: "" });
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, touchedFields },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
    mode: "onBlur", // Validate on blur for better UX
  });

  // Auto-populate email from navigation state or localStorage
  useEffect(() => {
    // Try to get email from navigation state first
    const emailFromState = location.state?.userEmail;
    
    // If not in state, try to get from localStorage (for persistence)
    const emailFromStorage = localStorage.getItem('userEmail');
    
    const emailToUse = emailFromState || emailFromStorage;
    
    if (emailToUse) {
      setValue('email', emailToUse);
    }
  }, [location.state, setValue]);

  // Watch message field for character count
  const messageValue = watch("message", "");
  const emailValue = watch("email", "");

  const handleInputChange = () => {
    // Clear status when user starts typing
    if (status.message) {
      setStatus({ type: "", message: "" });
    }
  };

  const onSubmit = async (data) => {
    try {
      setStatus({ type: "loading", message: "Sending message..." });

      // Backend API call using fetch
      const response = await fetch(
        "http://localhost:8000/api/contact-messages/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send message");
      }

      const responseData = await response.json();
      console.log("Response from backend:", responseData);

      setStatus({
        type: "success",
        message: "Message sent successfully! We'll get back to you soon.",
      });

      // Reset form but keep email
      const currentEmail = emailValue;
      reset();
      setValue('email', currentEmail);
    } catch (error) {
      console.error("Error sending message:", error);
      setStatus({
        type: "error",
        message: error.message || "Failed to send message. Please try again.",
      });
    }
  };

  const getFieldStatus = (fieldName) => {
    if (!touchedFields[fieldName]) return "default";
    return errors[fieldName] ? "error" : "success";
  };

  const getInputClassName = (fieldName, isReadOnly = false) => {
    const status = getFieldStatus(fieldName);
    const baseClass = `w-full border-b-2 border-gray-300 bg-transparent pb-2 sm:pb-3 text-sm sm:text-md focus:outline-none focus:border-red-400 transition-colors ${
      isReadOnly ? "cursor-not-allowed bg-gray-50 text-gray-600" : ""
    }`;

    if (status === "error") {
      return baseClass
        .replace("border-gray-300", "border-red-500")
        .replace("focus:border-red-400", "focus:border-red-500");
    } else if (status === "success") {
      return baseClass
        .replace("border-gray-300", "border-green-500")
        .replace("focus:border-red-400", "focus:border-green-500");
    }
    return baseClass;
  };

  const getTextareaClassName = (fieldName) => {
    const status = getFieldStatus(fieldName);
    const baseClass =
      "w-full border-b-2 border-gray-300 bg-transparent pb-2 text-sm sm:text-md focus:outline-none focus:border-red-400 resize-none transition-colors";

    if (status === "error") {
      return baseClass
        .replace("border-gray-300", "border-red-500")
        .replace("focus:border-red-400", "focus:border-red-500");
    } else if (status === "success") {
      return baseClass
        .replace("border-gray-300", "border-green-500")
        .replace("focus:border-red-400", "focus:border-green-500");
    }
    return baseClass;
  };

  // Check if email is auto-populated (read-only)
  const isEmailAutoPopulated = Boolean(location.state?.userEmail || localStorage.getItem('userEmail'));

  return (
    <div className="min-h-screen bg-gradient-to-t from-red-50 from-60% to-white flex flex-col">
      {/* Navbar - Fixed at top */}
      <Navbar />

      <div className="w-full px-3 sm:px-4 lg:px-6 py-2">
        <div className="max-w-7xl mx-auto">
          <BackButton />
        </div>
      </div>

      {/* Main Content - Takes remaining space */}
      <div className="flex-1 px-4 sm:px-6 md:px-9 py-4 sm:py-9">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-9">
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black mb-3 sm:mb-4 font-poppins">
            Get In Touch
          </h1>
          <p className="text-sm sm:text-base md:text-md mx-auto leading-relaxed max-w-3xl">
            For any inquiries, feedback, collaboration opportunities, or support
            requests, please
            <br className="hidden sm:block" />
            don't hesitate to get in touch with our team at HomelyBites is
            committed to assisting you with
            <br className="hidden sm:block" />
            care and professionalism
          </p>
        </div>

        {/* Contact Section */}
        <div className="bg-white rounded-xl py-4 max-w-[950px] mx-auto">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-12 px-4 sm:px-6">
            {/* Contact Information Card */}
            <div className="bg-red-400 rounded-3xl p-6 sm:p-8 md:p-12 text-white flex-shrink-0 w-full lg:w-[400px]">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">
                Contact Information
              </h2>
              <p className="mb-6 sm:mb-8 text-white/90 text-sm sm:text-base">
                Have something to share or ask?
                <br className="hidden sm:block" />
                Reach out to the HomelyBites team below.
              </p>

              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                  <div className="text-sm sm:text-base">
                    <div>98565656565</div>
                    <div>98674536373</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                  <div className="text-sm sm:text-base">
                    homelybites@gmail.com
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                  <div className="text-sm sm:text-base">Nayabazar, Balaju</div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="flex-1">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6 sm:space-y-8"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                  <div>
                    <div className="block text-greyy text-sm sm:text-md mb-1">
                      Your Name *
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Please enter full name"
                        {...register("name", {
                          onChange: handleInputChange,
                        })}
                        className={getInputClassName("name")}
                      />
                      {getFieldStatus("name") === "success" && (
                        <CheckCircle className="absolute right-0 top-1 w-4 h-4 text-green-500" />
                      )}
                      {getFieldStatus("name") === "error" && (
                        <AlertCircle className="absolute right-0 top-1 w-4 h-4 text-red-500" />
                      )}
                    </div>
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="block text-greyy text-sm sm:text-md mb-1">
                      Your Email *
                    </div>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="example@gmail.com"
                        {...register("email", {
                          onChange: handleInputChange,
                        })}
                        readOnly={isEmailAutoPopulated}
                        className={getInputClassName("email", isEmailAutoPopulated)}
                        title={isEmailAutoPopulated ? "Email from your account registration" : ""}
                      />
                      {getFieldStatus("email") === "success" && (
                        <CheckCircle className="absolute right-0 top-1 w-4 h-4 text-green-500" />
                      )}
                      {getFieldStatus("email") === "error" && (
                        <AlertCircle className="absolute right-0 top-1 w-4 h-4 text-red-500" />
                      )}
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="block text-greyy text-sm sm:text-md mb-1">
                    Your Subject *
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type your subject..."
                      {...register("subject", {
                        onChange: handleInputChange,
                      })}
                      className={getInputClassName("subject")}
                    />
                    {getFieldStatus("subject") === "success" && (
                      <CheckCircle className="absolute right-0 top-1 w-4 h-4 text-green-500" />
                    )}
                    {getFieldStatus("subject") === "error" && (
                      <AlertCircle className="absolute right-0 top-1 w-4 h-4 text-red-500" />
                    )}
                  </div>
                  {errors.subject && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.subject.message}
                    </p>
                  )}
                </div>

                <div>
                  <div className="block text-red-400 text-sm sm:text-md font-semibold mb-2">
                    Message *
                  </div>
                  <div className="relative">
                    <textarea
                      placeholder="Type your message..."
                      {...register("message", {
                        onChange: handleInputChange,
                      })}
                      rows="4"
                      className={getTextareaClassName("message")}
                    />
                    {getFieldStatus("message") === "success" && (
                      <CheckCircle className="absolute right-2 top-2 w-4 h-4 text-green-500" />
                    )}
                    {getFieldStatus("message") === "error" && (
                      <AlertCircle className="absolute right-2 top-2 w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    {errors.message ? (
                      <p className="text-red-500 text-xs flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.message.message}
                      </p>
                    ) : (
                      <div></div>
                    )}
                    <span className="text-xs text-gray-400">
                      {messageValue.length}/1000
                    </span>
                  </div>
                </div>

                {/* Status Message */}
                {status.message && (
                  <div
                    className={`p-3 rounded-md text-sm flex items-center gap-2 ${
                      status.type === "success"
                        ? "bg-green-100 text-green-800"
                        : status.type === "error"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {status.type === "success" ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : status.type === "error" ? (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-blue-600 border-r-transparent rounded-full animate-spin"></div>
                    )}
                    {status.message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-red-400 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full text-sm sm:text-md font-medium hover:bg-red-500 transition-colors w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-r-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    "Send Message"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ContactPage;
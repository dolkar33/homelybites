import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { User, Phone, Mail, MapPin } from "lucide-react";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = () => {
    console.log("Form submitted:", formData);
  };

  return (
    <div className="md:block flex flex-col justify-center min-h-screen bg-gradient-to-t from-vrless from-60% to-white">
      <Navbar />
      {/* Main Content */}
      <div className="px-4 sm:px-6 md:px-9 py-6 sm:py-9">
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
        <div className="bg-white rounded-xl py-4 max-w-[950px] mx-auto flex flex-col md:gird-cols-2 lg:flex-row">
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
              <div className="space-y-6 sm:space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                  <div>
                    <div className="block text-greyy text-sm sm:text-md mb-1">
                      Your Name
                    </div>
                    <input
                      type="text"
                      placeholder="Please enter full name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full border-b-2 border-gray-300 bg-transparent pb-2 sm:pb-3 text-sm sm:text-md focus:outline-none focus:border-red-400"
                    />
                  </div>

                  <div>
                    <div className="block text-greyy text-sm sm:text-md mb-1">
                      Your Email
                    </div>
                    <input
                      type="email"
                      placeholder="example@gmail.com"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full border-b-2 border-gray-300 bg-transparent pb-2 text-sm sm:text-md focus:outline-none focus:border-red-400"
                    />
                  </div>
                </div>

                <div>
                  <div className="block text-greyy text-sm sm:text-md mb-1">
                    Your Subject
                  </div>
                  <input
                    type="type"
                    placeholder="Type your subject..."
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full border-b-2 border-gray-300 bg-transparent pb-2 text-sm sm:text-lg focus:outline-none focus:border-red-400"
                  />
                </div>

                <div>
                  <div className="block text-red-400 text-sm sm:text-md font-semibold mb-2">
                    Message
                  </div>
                  <textarea
                    name="message"
                    placeholder="Type your message..."
                    value={formData.message}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full border-b-2 border-gray-300 bg-transparent pb-2 text-sm sm:text-lg focus:outline-none focus:border-red-400 resize-none"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  className="bg-red-400 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full text-sm sm:text-lg font-medium hover:bg-red-500 transition-colors w-full sm:w-auto"
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
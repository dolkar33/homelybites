import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { User, Phone, Mail, MapPin } from "lucide-react";
import axios from "axios";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState({ type: "", message: "" });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      setStatus({ type: "loading", message: "Sending message..." });
      const response = await axios.post("http://localhost:8000/api/contact-messages/", formData);
      setStatus({ type: "success", message: "Message sent successfully! We'll get back to you soon." });
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      setStatus({ 
        type: "error", 
        message: error.response?.data?.message || "Failed to send message. Please try again." 
      });
    }
  };

  return (
    <div className="md:block flex flex-col justify-center min-h-screen bg-gradient-to-t from-vrless from-60% to-white">
      <Navbar />
      {/* Main Content */}
      <div className="px-9 py-9">
        {/* Header */}
        <div className="text-center mb-9">
          <h1 className="sm:text-5xl md:text-5xl font-bold text-black mb-4 font-poppins">
            Get In Touch
          </h1>
          <p className="text-md mx-auto leading-relaxed">
            For any inquiries, feedback, collaboration opportunities, or support
            requests,please
            <br />
            don't hesitate to get in touch — our team at HomelyBites is
            committed to assisting you with
            <br />
            care and professionalism
          </p>
        </div>
        {/* Contact Section */}
        <div className="bg-white rounded-xl py-4 max-w-[1000px] mx-auto flex">
          <div className="max-w-6xl mx-auto flex gap-12">
            {/* Contact Information Card */}
            <div
              className="bg-red-400 rounded-3xl p-12 text-white flex-shrink-0"
              style={{ width: "400px" }}
            >
              <h2 className="text-2xl font-semibold mb-4">
                Contact Information
              </h2>
              <p className="mb-8 text-white/90">
                Have something to share or ask? 
                <br />
                Reach out to the HomelyBites team below.
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Phone className="w-5 h-5" />
                  <div>
                    <div>98565656565</div>
                    <div>98674536373</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Mail className="w-5 h-5" />
                  <div>homelybites@gmail.com</div>
                </div>

                <div className="flex items-center gap-4">
                  <MapPin className="w-5 h-5" />
                  <div>Nayabazar, Balaju</div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="flex-1">
              <div className="space-y-8">
                {status.message && (
                  <div className={`p-4 rounded-lg ${
                    status.type === "success" ? "bg-green-100 text-green-700" :
                    status.type === "error" ? "bg-red-100 text-red-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    {status.message}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="block text-greyy text-md mb-1">
                      Your Name
                    </div>
                    <input
                      type="text"
                      placeholder="Please enter full name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full border-b-2 border-gray-300 bg-transparent pb-3 text-md focus:outline-none focus:border-red-400"
                    />
                  </div>
                  
                  <div>
                    <div className="block text-greyy text-md mb-1">
                      Your Email
                    </div>
                    <input
                      type="email"
                      placeholder="example@gmail.com"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full border-b-2 border-gray-300 bg-transparent pb-2 text-md focus:outline-none focus:border-red-400"
                    />
                  </div>
                </div>

                <div>
                  <div className="block text-greyy text-md mb-1">
                    Your Subject
                  </div>
                  <input
                    type="type"
                    placeholder="Type your subject..."
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full border-b-2 border-gray-300 bg-transparent pb-2 text-lg focus:outline-none focus:border-red-400"
                  />
                </div>

                <div>
                  <div className="block text-red-400 text-md font-semibold mb-2">
                    Message
                  </div>
                  <textarea
                    name="message"
                    placeholder="Type your message..."
                    value={formData.message}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full border-b-2 border-gray-300 bg-transparent pb-2 text-lg focus:outline-none focus:border-red-400 resize-none"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={status.type === "loading"}
                  className={`bg-red-400 text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-red-500 transition-colors ${
                    status.type === "loading" ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {status.type === "loading" ? "Sending..." : "Send Message"}
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

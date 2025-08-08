import React, { useState } from 'react';
import { X, Image, Upload, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';


<Navbar />


const categoriesList = [
  "Recipe",
  "Cooking Tip",
  "Restaurant Review",
  "General Discussion",
  "Question"
];

const PostPage = () => {
  const [uploadError, setUploadError] = useState('');
  const [videoThumbnails, setVideoThumbnails] = useState({});
  const [newPost, setNewPost] = useState({
    content: '',
    images: [],
    title: '',
    category: ''
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  // Mock current user data
  const currentUser = {
    name: 'Jennie Kim',
    avatar: '/Images/CommunityPage/jennie.jpg'
  };

  // Helper: extract random frame from video file
  const extractRandomThumbnail = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(file);
      video.onloadedmetadata = () => {
        const duration = video.duration;
        const time = Math.random() * duration;
        video.currentTime = time;
      };
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
        URL.revokeObjectURL(video.src);
      };
      video.onerror = () => resolve(null);
    });
  };

  // Main upload handler
  const handleImageUpload = async (event) => {
    setUploadError('');
    const files = Array.from(event.target.files);
    let currentCount = newPost.images.length;
    if (currentCount + files.length > 7) {
      setUploadError('You can only upload up to 7 files.');
      return;
    }
    const imagePromises = files.map(async (file) => {
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      const fileData = await new Promise((resolve) => {
        reader.onload = (e) => resolve({
          file,
          preview: e.target.result,
          name: file.name,
          type: file.type,
          isVideo,
        });
        reader.readAsDataURL(file);
      });
      if (isVideo) {
        // Extract random thumbnail
        const thumb = await extractRandomThumbnail(file);
        setVideoThumbnails((prev) => ({ ...prev, [file.name]: thumb }));
        fileData.thumbnail = thumb;
      }
      return fileData;
    });
    const images = await Promise.all(imagePromises);
    setNewPost(prev => ({
      ...prev,
      images: [...prev.images, ...images]
    }));
  };

  // Thumbnail selection for video
  const handleSelectThumbnail = (fileName) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setVideoThumbnails((prev) => ({ ...prev, [fileName]: ev.target.result }));
        setNewPost(prev => ({
          ...prev,
          images: prev.images.map(img =>
            img.name === fileName ? { ...img, thumbnail: ev.target.result } : img
          )
        }));
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const event = { target: { files } };
      handleImageUpload(event);
    }
  };

  const removeImage = (index) => {
    setNewPost(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleCreatePost = () => {
    if (!newPost.content.trim() && newPost.images.length === 0) return;
    
    // TODO: Add API call to create post
    console.log('Creating post:', newPost);
    
    // Reset form and show success message or navigate back
    setNewPost({ content: '', images: [], title: '' });
    alert('Post created successfully!');
    
  };

  const handleGoBack = () => {
  
    window.history.back();
  };

  const triggerFileInput = () => {
    document.getElementById('post-file-input').click();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="flex-1 px-4 md:px-8 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <button 
              onClick={handleGoBack}
              className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-lg font-medium">Back</span>
            </button>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-3xl font-bold text-gray-800 text-center">Create Post</h2>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* User Post Input Section */}
              <div className="bg-gray-100 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <img 
                      src={currentUser.avatar} 
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-bold text-gray-800">{currentUser.name}</span>
                </div>
                
                <div className="flex bg-white rounded-xl p-3 gap-3 relative items-center">
                  <input
                    type="text"
                    placeholder="What is in your mind?"
                    value={newPost.content}
                    onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                    className="flex-1 outline-none text-gray-600"
                  />
                  {/* Category Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      className={`flex items-center px-3 py-2 rounded-lg bg-accent text-white font-semibold focus:outline-none focus:ring-2 focus:ring-accent transition-colors hover:bg-accent/80 ${dropdownOpen ? 'ring-2 ring-accent' : ''}`}
                      onClick={() => setDropdownOpen((open) => !open)}
                    >
                      {selectedCategory || 'Categories'}
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-44 rounded-lg shadow bg-white z-10 border border-gray-100">
                        {categoriesList.map((cat) => (
                          <button
                            key={cat}
                            className={`block w-full text-left px-4 py-2 text-gray-800 hover:bg-red-100 hover:text-red-500 transition-colors ${selectedCategory === cat ? 'bg-red-50 text-red-500' : ''}`}
                            onClick={() => { setSelectedCategory(cat); setDropdownOpen(false); setNewPost(prev => ({ ...prev, category: cat })); }}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Image Upload Area */}
              <div className="border-2 border-gray-200 rounded-2xl p-8">
                <div 
                  onClick={triggerFileInput}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
                    isDragOver 
                      ? 'border-red-400 bg-red-50' 
                      : 'border-gray-300 hover:border-red-400 hover:bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                      <Image className="w-8 h-8 text-red-400" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-gray-800 mb-2">Add photos/videos</p>
                  <p className="text-gray-500">or drag and drop</p>
                </div>
                
                <input
                  id="post-file-input"
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Upload Error */}
              {uploadError && (
                <div className="text-red-500 text-sm mb-2">{uploadError}</div>
              )}

              {/* Image & Video Preview */}
              {newPost.images.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-700 mb-3">Selected Files:</h4>
                  <div className="flex gap-4 flex-wrap">
                    {newPost.images.map((media, index) => (
                      <div key={index} className="relative group w-24 h-24 flex flex-col items-center">
                        {/* Image Preview */}
                        {!media.isVideo ? (
                          <img
                            src={media.preview}
                            alt={`Preview ${index + 1}`}
                            className="w-24 h-24 object-cover rounded-xl border"
                          />
                        ) : (
                          <div className="relative w-24 h-24">
                            <img
                              src={media.thumbnail || videoThumbnails[media.name] || ''}
                              alt="Video Thumbnail"
                              className="w-24 h-24 object-cover rounded-xl border bg-black"
                            />
                            {/* Play Icon Overlay */}
                            <svg className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-white opacity-80 pointer-events-none" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                          </div>
                        )}
                        {/* Remove Button */}
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-80 hover:opacity-100 transition-opacity"
                          style={{width: '20px', height: '20px'}}>
                          <X className="w-3 h-3" />
                        </button>
                        {/* Select Thumbnail for Video */}
                        {media.isVideo && (
                          <button
                            type="button"
                            onClick={() => handleSelectThumbnail(media.name)}
                            className="mt-1 px-2 py-1 text-xs bg-gray-100 rounded hover:bg-red-100 text-gray-700 border border-gray-200"
                          >
                            Select Thumbnail
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 flex justify-center">
              <button
                onClick={handleCreatePost}
                disabled={!newPost.content.trim() && newPost.images.length === 0}
                className="px-12 py-3 bg-red-400 text-white rounded-xl hover:bg-red-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-bold text-lg"
              >
                Create Post
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PostPage;
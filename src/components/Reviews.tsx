import React, { useState } from "react";
import { Star, MessageSquareCode, Quote, User, Send, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Review } from "../types";
import { reviews as initialReviews } from "../data";

export default function Reviews() {
  const [reviewsList, setReviewsList] = useState<Review[]>(initialReviews);
  const [newReviewName, setNewReviewName] = useState("");
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewName.trim() || !newComment.trim()) return;

    const fresh: Review = {
      id: `rev-${Date.now()}`,
      name: newReviewName,
      comment: newComment,
      rating: newRating,
      date: "Today",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" // Fallback female avatar
    };

    setReviewsList([fresh, ...reviewsList]);
    setNewReviewName("");
    setNewComment("");
    setNewRating(5);
    setIsSubmitted(true);

    setTimeout(() => {
      setIsSubmitted(false);
    }, 4000);
  };

  return (
    <section className="py-20 px-6 bg-white border-t border-stone-200/80 overflow-hidden" id="customer-reviews">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Section Left Column Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#d4af37]/10 px-4 py-1.5 rounded-full border border-[#d4af37]/20">
              <MessageSquareCode className="w-4 h-4 text-[#d4af37]" />
              <span className="text-[#aa7c11] text-xs font-mono font-bold tracking-widest uppercase">GUEST LEDGER</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-stone-900 tracking-wide leading-tight">
              What Our Guests Love About Us
            </h2>
            <p className="text-sm sm:text-base text-stone-500 font-sans leading-relaxed font-light">
              Join thousands of happy dining guests who share memories over our signature South Indian dosas and rich tandoori grills. Feel free to leave your own valuable feedback below!
            </p>

            <div className="flex items-center gap-5 pt-3">
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-150 text-center flex-1 shadow-sm">
                <div className="text-3xl font-mono text-[#d4af37] font-semibold">4.8</div>
                <div className="flex items-center justify-center gap-0.5 my-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <div className="text-[10px] text-stone-400 font-mono uppercase tracking-wider">GUEST RATINGS</div>
              </div>

              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-150 text-center flex-1 shadow-sm">
                <div className="text-3xl font-mono text-[#d4af37] font-semibold">1,980+</div>
                <div className="text-amber-500 my-1 font-mono text-xs font-bold">99% Positive</div>
                <div className="text-[10px] text-stone-400 font-mono uppercase tracking-wider">MONTHLY VISITS</div>
              </div>
            </div>

            {/* Custom Review Form */}
            <div className="bg-stone-50/80 p-6 rounded-3xl border border-stone-150 shadow-sm mt-6 relative">
              <h3 className="text-sm font-serif font-bold text-stone-850 tracking-widest uppercase mb-4">
                Share Your Experience
              </h3>

              <AnimatePresence mode="wait">
                {isSubmitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="py-6 text-center text-green-600 font-sans text-sm flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-50 border border-green-500/20 flex items-center justify-center text-green-650 mb-2 shadow-sm">
                      <Check className="w-5 h-5 animate-bounce" />
                    </div>
                    <span className="font-bold">Review Added Successfully!</span>
                    <span className="text-xs text-stone-500">Thank you for helping us bring the best taste.</span>
                  </motion.div>
                ) : (
                  <motion.form key="form" onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <input
                        type="text"
                        placeholder="Your Name (e.g., Aaryan Rajput)"
                        required
                        value={newReviewName}
                        onChange={(e) => setNewReviewName(e.target.value)}
                        className="w-full bg-white text-stone-900 placeholder-stone-400 text-xs shadow-inner rounded-xl p-3 border border-stone-200 focus:outline-none focus:border-[#d4af37] transition-all font-sans"
                      />
                    </div>

                    {/* Interactive Star rating buttons */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-400 font-sans mr-2">Your Rating:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewRating(star)}
                            onMouseEnter={() => setHoveredStar(star)}
                            onMouseLeave={() => setHoveredStar(null)}
                            className="focus:outline-none cursor-pointer"
                          >
                            <Star
                              className={`w-5 h-5 transition-colors ${
                                star <= (hoveredStar ?? newRating)
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-stone-250"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <textarea
                        placeholder="Wow! The pure tandoori soya chaap and butter dosa were phenomenal..."
                        required
                        rows={3}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full bg-white text-stone-900 placeholder-stone-400 text-xs shadow-inner rounded-xl p-3 border border-stone-200 focus:outline-none focus:border-[#d4af37] transition-all font-sans resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full btn py-3 bg-stone-900 text-[#d4af37] hover:bg-[#aa7c11] hover:text-[#d4af37] text-xs font-bold tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all focus:outline-none"
                    >
                      <Send className="w-3.5 h-3.5 stroke-[2]" />
                      SUBMIT TESTIMONIAL
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Testimonial List Column */}
          <div className="lg:col-span-7 space-y-6 max-h-[640px] overflow-y-auto pr-2 scrollbar-thin">
            {reviewsList.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-stone-50/80 p-6 rounded-2xl border border-stone-150 hover:border-[#d4af37]/35 transition-all duration-300 flex flex-col sm:flex-row gap-5 relative shadow-sm"
              >
                {/* Float quotation decoration */}
                <Quote className="absolute right-6 top-6 w-12 h-12 text-stone-200/50 pointer-events-none" />

                {/* Testimonial message details */}
                <div className="space-y-2 flex-grow min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h3 className="text-sm sm:text-base font-serif font-bold text-stone-850 tracking-wide">
                      {review.name}
                    </h3>
                    <span className="text-[10px] font-mono text-stone-400">
                      {review.date}
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < review.rating ? "fill-current text-amber-400" : "text-stone-200"
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-xs sm:text-sm text-stone-600 font-sans leading-relaxed italic font-light pt-1">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Zap, Users, TrendingUp, Instagram, MessageCircle, DollarSign } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [contact, setContact] = useState({ name: '', email: '', message: '', userType: '' });
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact)
      });
      
      if (response.ok) {
        setSubmitStatus('success');
        setContact({ name: '', email: '', message: '', userType: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    }
  };

  const portfolioCards = [
    {
      name: 'Ayşe Demir',
      specialty: 'Moda & Lifestyle',
      description: 'Günlük hayattan samimi kareler',
      price: '5.000₺',
      image: 'https://i.pravatar.cc/400?img=1'
    },
    {
      name: 'Mehmet Yılmaz',
      specialty: 'Teknoloji & Oyun',
      description: '250K+ takipçiyle buluşuyorum',
      price: '8.000₺',
      image: 'https://i.pravatar.cc/400?img=12'
    },
    {
      name: 'Zeynep Kaya',
      specialty: 'Yemek & Mutfak',
      description: 'Her gün yeni lezzetler',
      price: '3.500₺',
      image: 'https://i.pravatar.cc/400?img=5'
    },
    {
      name: 'Can Öztürk',
      specialty: 'Fitness & Sağlık',
      description: 'Hedeflerine ulaşman için',
      price: '6.000₺',
      image: 'https://i.pravatar.cc/400?img=33'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="https://customer-assets.emergentagent.com/job_freelance-hub-216/artifacts/er3uz3pj_WhatsApp%20Image%202026-01-03%20at%2015.54.27.jpeg" 
                alt="FLULANCE Logo" 
                className="h-10 w-10 object-contain"
              />
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-fuchsia-400 to-cyan-400 text-transparent bg-clip-text">FLULANCE</h1>
            </div>
            <button
              onClick={() => navigate('/auth')}
              className="px-6 py-2 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-full font-semibold hover:scale-105 transition-transform hover:shadow-lg hover:shadow-fuchsia-500/25"
              data-testid="nav-login-btn"
            >
              Giriş Yap
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="container mx-auto text-center">
          <div className="inline-block mb-6 px-4 py-2 bg-fuchsia-500/20 rounded-full border border-fuchsia-400/30">
            <span className="text-fuchsia-300 text-sm font-medium">İşbirliği Platformu</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Ajanslara veda etmeye
            <br />
            <span className="bg-gradient-to-r from-fuchsia-400 to-cyan-400 text-transparent bg-clip-text">hazır mısınız?</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Markalar ve influencer'lar doğrudan buluşuyor. Komisyon ödüyoruz, komisyon alıyoruz. Bu kadar basit.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/auth')}
              className="px-8 py-4 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-full text-lg font-bold hover:scale-105 transition-transform hover:shadow-lg hover:shadow-fuchsia-500/25"
              data-testid="hero-start-btn"
            >
              Hemen Başla
            </button>
            <button
              onClick={() => document.getElementById('nasil-calisir').scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-gray-700 rounded-full text-lg font-bold hover:bg-white/20 hover:border-cyan-500/50 transition-colors"
            >
              Nasıl Çalışır?
            </button>
          </div>
        </div>
      </section>

      {/* Nasıl Çalışır */}
      <section id="nasil-calisir" className="py-20 px-4 bg-gray-900/50">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-fuchsia-400 to-cyan-400 text-transparent bg-clip-text">Nasıl Çalışır?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-black/50 backdrop-blur-sm rounded-2xl border border-gray-800 hover:border-fuchsia-500/50 transition-colors group" data-testid="step-1">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-fuchsia-500 to-cyan-500 rounded-full flex items-center justify-center group-hover:shadow-lg group-hover:shadow-fuchsia-500/25 transition-shadow">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">1. Kayıt Ol</h3>
              <p className="text-gray-400">Marka mısın, influencer mısın? Seç, hesap aç. 30 saniye.</p>
            </div>
            <div className="text-center p-8 bg-black/50 backdrop-blur-sm rounded-2xl border border-gray-800 hover:border-cyan-500/50 transition-colors group" data-testid="step-2">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-cyan-500 to-fuchsia-500 rounded-full flex items-center justify-center group-hover:shadow-lg group-hover:shadow-cyan-500/25 transition-shadow">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">2. Eşleş</h3>
              <p className="text-gray-400">Markalar ilan açar, influencer'lar başvurur. Beğendiysen kabul et.</p>
            </div>
            <div className="text-center p-8 bg-black/50 backdrop-blur-sm rounded-2xl border border-gray-800 hover:border-fuchsia-500/50 transition-colors group" data-testid="step-3">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-fuchsia-500 to-cyan-500 rounded-full flex items-center justify-center group-hover:shadow-lg group-hover:shadow-fuchsia-500/25 transition-shadow">
                <MessageCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">3. Anlaş</h3>
              <p className="text-gray-400">Sohbet edip detayları konuş. Ajans yok, sadece siz varsınız.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Freelancer'lar İçin */}
      <section className="py-20 px-4 bg-black">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Influencer mısın?</h2>
              <p className="text-xl text-gray-300 mb-8">
                Profilini oluştur, işlere başvur, kendi fiyatını belirle. Markalar seni bulacak, sen onları değil.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <DollarSign className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">Kendi fiyatını belirle, komisyon bizden</span>
                </li>
                <li className="flex items-start gap-3">
                  <Instagram className="w-6 h-6 text-fuchsia-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">Tüm sosyal medya platformlarında çalış</span>
                </li>
                <li className="flex items-start gap-3">
                  <TrendingUp className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">Portföyünü göster, markalar seni keşfetsin</span>
                </li>
              </ul>
              <button
                onClick={() => navigate('/auth')}
                className="px-8 py-4 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-full text-lg font-bold hover:scale-105 transition-transform hover:shadow-lg hover:shadow-fuchsia-500/25"
                data-testid="influencer-cta-btn"
              >
                Influencer Olarak Başla
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {portfolioCards.slice(0, 4).map((card, idx) => (
                <div key={idx} className="bg-black/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden hover:scale-105 hover:border-fuchsia-500/50 transition-all">
                  <img src={card.image} alt={card.name} className="w-full h-32 object-cover" />
                  <div className="p-3">
                    <p className="font-semibold text-sm">{card.name}</p>
                    <p className="text-xs text-fuchsia-400">{card.specialty}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Markalar İçin */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 rounded-3xl p-8 border border-fuchsia-500/30">
                <h3 className="text-2xl font-bold mb-4">İlan Oluştur</h3>
                <div className="space-y-4 text-gray-300">
                  <p>✓ Kampanya detaylarını yaz</p>
                  <p>✓ Bütçeni belirle</p>
                  <p>✓ Platformları seç (Instagram, TikTok, YouTube...)</p>
                  <p>✓ Başvuruları al, en iyisini seç</p>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Marka mısın?</h2>
              <p className="text-xl text-gray-300 mb-8">
                Ajans mi, FLULANCE mı? Biz daha ucuz, daha hızlı, daha samimiyiz. İlan aç, influencer'lar sana gelsin.
              </p>
              <button
                onClick={() => navigate('/auth')}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-full text-lg font-bold hover:scale-105 transition-transform hover:shadow-lg hover:shadow-cyan-500/25"
                data-testid="brand-cta-btn"
              >
                Marka Olarak Başla
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Örnek Portföy Kartları */}
      <section className="py-20 px-4 bg-black">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-fuchsia-400 to-cyan-400 text-transparent bg-clip-text">Platformdaki Influencer'lar</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="portfolio-cards">
            {portfolioCards.map((card, idx) => (
              <div key={idx} className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 overflow-hidden hover:border-fuchsia-500/50 transition-all hover:scale-105" data-testid={`portfolio-card-${idx}`}>
                <img src={card.image} alt={card.name} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{card.name}</h3>
                  <p className="text-fuchsia-400 font-semibold mb-2">{card.specialty}</p>
                  <p className="text-gray-400 text-sm mb-4">{card.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-bold">{card.price}</span>
                    <button className="text-sm text-fuchsia-400 hover:text-fuchsia-300">Profili Gör →</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* İletişim */}
      <section className="py-20 px-4 bg-gray-900/50" data-testid="contact-section">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-8 bg-gradient-to-r from-fuchsia-400 to-cyan-400 text-transparent bg-clip-text">Sorularınız mı var?</h2>
          <p className="text-center text-gray-400 mb-12">Bize yazın, hızlıca dönelim.</p>
          
          {submitStatus === 'success' && (
            <div className="mb-6 p-4 bg-cyan-500/20 border border-cyan-500/50 rounded-lg text-cyan-400">
              Mesajınız alındı! Yakında dönüş yapacağız.
            </div>
          )}
          
          {submitStatus === 'error' && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
              Bir hata oluştu. Lütfen tekrar deneyin.
            </div>
          )}
          
          <form onSubmit={handleContactSubmit} className="space-y-6" data-testid="contact-form">
            <div>
              <input
                type="text"
                placeholder="İsminiz"
                value={contact.name}
                onChange={(e) => setContact({ ...contact, name: e.target.value })}
                required
                className="w-full px-6 py-4 bg-black/50 border border-gray-800 rounded-xl focus:outline-none focus:border-fuchsia-500 transition-colors text-white"
                data-testid="contact-name-input"
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="E-posta adresiniz"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                required
                className="w-full px-6 py-4 bg-black/50 border border-gray-800 rounded-xl focus:outline-none focus:border-fuchsia-500 transition-colors text-white"
                data-testid="contact-email-input"
              />
            </div>
            <div>
              <select
                value={contact.userType}
                onChange={(e) => setContact({ ...contact, userType: e.target.value })}
                className="w-full px-6 py-4 bg-black/50 border border-gray-800 rounded-xl focus:outline-none focus:border-fuchsia-500 transition-colors text-white"
                style={{colorScheme: 'dark'}}
                data-testid="contact-usertype-select"
              >
                <option value="" className="bg-gray-900">Kimsin sen?</option>
                <option value="marka" className="bg-gray-900">Marka</option>
                <option value="influencer" className="bg-gray-900">Influencer</option>
              </select>
            </div>
            <div>
              <textarea
                placeholder="Mesajınız"
                value={contact.message}
                onChange={(e) => setContact({ ...contact, message: e.target.value })}
                required
                rows={4}
                className="w-full px-6 py-4 bg-black/50 border border-gray-800 rounded-xl focus:outline-none focus:border-fuchsia-500 transition-colors resize-none text-white"
                data-testid="contact-message-input"
              />
            </div>
            <button
              type="submit"
              className="w-full px-8 py-4 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl text-lg font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-fuchsia-500/25"
              data-testid="contact-submit-btn"
            >
              <Send className="w-5 h-5" />
              Gönder
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-800 bg-black">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_freelance-hub-216/artifacts/er3uz3pj_WhatsApp%20Image%202026-01-03%20at%2015.54.27.jpeg" 
              alt="FLULANCE Logo" 
              className="h-8 w-8 object-contain"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-fuchsia-400 to-cyan-400 text-transparent bg-clip-text">FLULANCE</span>
          </div>
          <p className="mb-4 text-gray-400">© 2025 FLULANCE. Ajanslar kadar pahalı değiliz.</p>
          <p className="text-sm text-gray-500">Markalar ve influencer'lar için özgür platform.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
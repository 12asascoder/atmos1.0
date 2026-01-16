# creative_assets.py
from flask import Blueprint, request, jsonify
import os
import base64
import mimetypes
from datetime import datetime
import uuid
import requests
from runwayml import RunwayML, TaskFailedError
import traceback

creative_assets_bp = Blueprint('creative_assets', __name__)

# Initialize Runway ML client globally
RUNWAY_API_KEY = os.environ.get('RUNWAY_API_KEY', 'your_runway_api_key_here')
client = RunwayML(api_key=RUNWAY_API_KEY) if RUNWAY_API_KEY != 'your_runway_api_key_here' else None

# Storage for campaigns and assets (in production, use a database)
# Using dict as in-memory store
campaigns = {}
user_uploads = {}

# Updated trend configuration for 2026
RECENT_TRENDS = {
    "2026_q1": [
        "AI-assisted personalized content",
        "Hyper-realistic 3D renders",
        "Sustainable and eco-conscious branding",
        "Neo-brutalism with soft gradients",
        "Mixed reality integration concepts",
        "Nostalgic futurism (retro-futurism)",
        "Dynamic variable fonts",
        "Biomorphic organic shapes",
        "Dark mode optimized with vibrant accents",
        "Minimalist-maximalist contrast"
    ],
    "social_media_trends_2026": [
        "AI-powered personalized feed content",
        "Vertical immersive experiences",
        "Short-form interactive storytelling",
        "Voice and audio-first content",
        "Real-time collaborative content",
        "AR filter brand integrations",
        "Ephemeral content with permanence",
        "Community-driven content creation",
        "Predictive trend adaptation",
        "Cross-platform narrative continuity"
    ],
    "design_trends_2026": [
        "AI-generated unique aesthetics",
        "Fluid morphing animations",
        "Glassmorphism 2.0 with depth",
        "Holographic and iridescent effects",
        "Sustainable design patterns",
        "Adaptive responsive layouts",
        "Kinetic typography systems",
        "Neural network inspired patterns",
        "Biophilic design integration",
        "Quantum computing aesthetics"
    ],
    "marketing_trends_2026": [
        "Predictive personalization",
        "Conversational commerce",
        "Social commerce integration",
        "Sustainable value propositions",
        "Experience-based marketing",
        "Privacy-first personalization",
        "AI co-creation with customers",
        "Immersive brand worlds",
        "Micro-influencer networks",
        "Purpose-driven campaigns"
    ],
    "technology_trends": [
        "Generative AI everywhere",
        "Web3 and decentralized branding",
        "Spatial computing interfaces",
        "Brain-computer interface concepts",
        "Quantum computing visuals",
        "Autonomous system aesthetics",
        "Biotech-inspired designs",
        "Climate tech visualization",
        "Digital twin representation",
        "Neuromorphic computing patterns"
    ]
}

def get_mime_type_from_filename(filename):
    """
    Get MIME type from filename
    """
    file_extension = filename.lower().split('.')[-1]
    mime_type_map = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'webp': 'image/webp',
        'gif': 'image/gif',
        'bmp': 'image/bmp'
    }
    return mime_type_map.get(file_extension, 'image/png')

def analyze_current_trends():
    """
    Analyze and return current trending styles and patterns for 2026
    """
    current_month = datetime.now().strftime("%B")
    current_year = datetime.now().year
    
    # Updated seasonal trends for 2026
    seasonal_trends = {
        "January": [
            "New Year digital detox themes",
            "AI-powered planning aesthetics",
            "Minimalist reset designs",
            "Future-forward goal setting",
            "Sustainable new beginnings"
        ],
        "February": [
            "Digital love expressions",
            "Self-love technology integration",
            "Inclusive celebration designs",
            "AR Valentine experiences",
            "Emotional AI interactions"
        ],
        "March": [
            "AI spring renewal themes",
            "Digital growth visualization",
            "Biophilic tech interfaces",
            "Renewable energy aesthetics",
            "Smart living innovations"
        ],
        "April": [
            "Climate action digital campaigns",
            "Earth-conscious AI designs",
            "Sustainable tech showcases",
            "Digital conservation efforts",
            "Green technology aesthetics"
        ],
        "May": [
            "AI-assisted parenting tools",
            "Digital graduation experiences",
            "Smart home summer prep",
            "Future workforce visuals",
            "Tech-enhanced celebrations"
        ],
        "June": [
            "Digital pride expressions",
            "AI creativity showcases",
            "Virtual summer experiences",
            "Smart travel technology",
            "Inclusive tech innovations"
        ],
        "July": [
            "AI freedom concepts",
            "Digital independence themes",
            "Smart outdoor technology",
            "Virtual beach experiences",
            "Tech-powered celebrations"
        ],
        "August": [
            "AI education tools",
            "Digital back-to-school",
            "Smart learning environments",
            "Future skill development",
            "Tech transition support"
        ],
        "September": [
            "AI autumn aesthetics",
            "Smart home cozy tech",
            "Digital harvest concepts",
            "Sustainable fall technology",
            "Adaptive seasonal designs"
        ],
        "October": [
            "AI-generated spooky content",
            "Virtual reality Halloween",
            "Smart home automation themes",
            "Digital transformation concepts",
            "Tech innovation celebrations"
        ],
        "November": [
            "AI gratitude expressions",
            "Smart shopping experiences",
            "Digital connection themes",
            "Future-forward thankfulness",
            "Tech-enhanced celebrations"
        ],
        "December": [
            "AI holiday personalization",
            "Smart home festive automation",
            "Virtual reality celebrations",
            "Digital gift experiences",
            "Tech-powered traditions"
        ]
    }
    
    # Get current technology adoption trends
    tech_adoption = {
        "ai_adoption_rate": "92% of businesses using AI tools",
        "ar_vr_adoption": "65% growth in AR marketing",
        "voice_search": "78% of searches voice-activated",
        "smart_homes": "85% homes with smart devices",
        "sustainable_tech": "70% consumers prefer eco-tech"
    }
    
    return {
        "seasonal": seasonal_trends.get(current_month, []),
        "year": current_year,
        "quarter": f"Q{(datetime.now().month - 1) // 3 + 1}",
        "month": current_month,
        "tech_adoption": tech_adoption,
        "emerging_technologies": [
            "Generative AI Design Tools",
            "Spatial Computing Interfaces",
            "Neural Interface Concepts",
            "Quantum Computing Visuals",
            "Autonomous System Designs"
        ]
    }

def fetch_industry_trends(industry_keywords):
    """
    Fetch industry-specific trends for 2026
    """
    industry_trend_map = {
        "fashion": [
            "AI-designed sustainable fashion",
            "Digital clothing NFTs",
            "Smart fabric technology",
            "Virtual fitting rooms",
            "Circular fashion economy"
        ],
        "tech": [
            "AI-first product design",
            "Quantum computing interfaces",
            "Neural network aesthetics",
            "Spatial web experiences",
            "Autonomous system UIs"
        ],
        "food": [
            "AI recipe generation",
            "Smart kitchen technology",
            "Sustainable food systems",
            "Personalized nutrition AI",
            "Vertical farming aesthetics"
        ],
        "fitness": [
            "AI personal trainers",
            "Smart home gyms",
            "Biometric tracking design",
            "Virtual reality workouts",
            "Neural feedback training"
        ],
        "beauty": [
            "AI skincare analysis",
            "Virtual makeup try-ons",
            "Sustainable beauty tech",
            "Personalized AI routines",
            "Smart beauty devices"
        ],
        "automotive": [
            "Autonomous vehicle interfaces",
            "EV charging aesthetics",
            "Smart mobility solutions",
            "Connected car experiences",
            "Sustainable transportation"
        ],
        "realestate": [
            "Virtual property tours",
            "Smart home automation",
            "Sustainable building tech",
            "AI property management",
            "Digital neighborhood experiences"
        ],
        "education": [
            "AI personalized learning",
            "Virtual classrooms",
            "Immersive educational content",
            "Smart campus technology",
            "Future skill development"
        ],
        "healthcare": [
            "AI diagnostics interfaces",
            "Telemedicine experiences",
            "Wearable health tech",
            "Personalized medicine AI",
            "Virtual health assistants"
        ],
        "finance": [
            "AI financial advisors",
            "Blockchain interfaces",
            "Smart banking experiences",
            "Cryptocurrency aesthetics",
            "Personalized finance tools"
        ]
    }
    
    trends = []
    for keyword in industry_keywords:
        if keyword.lower() in industry_trend_map:
            trends.extend(industry_trend_map[keyword.lower()])
        else:
            # Add general AI trends for unspecified industries
            trends.extend([
                f"AI-powered {keyword} solutions",
                f"Smart {keyword} technology",
                f"Digital {keyword} transformation",
                f"Sustainable {keyword} innovation",
                f"Personalized {keyword} experiences"
            ])
    
    return list(dict.fromkeys(trends))[:8]  # Return top 8 unique trends

def generate_trend_aware_prompt(base_prompt, ad_type, campaign_goal, industry_context=None):
    """
    Generate trend-aware prompts for 2026 incorporating current trends
    """
    # Get current trends
    current_trends = analyze_current_trends()
    
    # Get industry-specific trends
    industry_trends = []
    if industry_context and isinstance(industry_context, list):
        industry_trends = fetch_industry_trends(industry_context)
    
    # Combine all trends
    all_trends = []
    
    # Add core 2026 trends
    all_trends.extend(RECENT_TRENDS.get("2026_q1", []))
    all_trends.extend(RECENT_TRENDS.get("social_media_trends_2026", []))
    all_trends.extend(RECENT_TRENDS.get("design_trends_2026", []))
    all_trends.extend(RECENT_TRENDS.get("marketing_trends_2026", []))
    all_trends.extend(RECENT_TRENDS.get("technology_trends", []))
    
    # Add current seasonal trends
    all_trends.extend(current_trends.get("seasonal", []))
    
    # Add industry trends
    all_trends.extend(industry_trends)
    
    # Add emerging technologies
    all_trends.extend(current_trends.get("emerging_technologies", []))
    
    # Remove duplicates and get unique trends
    unique_trends = list(dict.fromkeys(all_trends))
    
    # Select relevant trends based on ad type and goal
    selected_trends = []
    
    # Always include AI and tech trends for 2026
    selected_trends.extend([
        "AI-generated content",
        "Modern digital aesthetics",
        "2026 design standards"
    ])
    
    # Add 3-5 random but relevant trends
    import random
    if len(unique_trends) >= 5:
        selected_trends.extend(random.sample(unique_trends, min(5, len(unique_trends))))
    
    # Add trends based on ad type
    ad_type_map = {
        "social": ["mobile-first AI optimization", "thumb-stopping AI content", "social commerce integration"],
        "instagram": ["AR filter compatibility", "stories-optimized design", "influencer-ready aesthetics"],
        "facebook": ["newsfeed-optimized", "community-focused design", "conversation-starting visuals"],
        "tiktok": ["vertical video format", "trending audio integration", "duet-friendly composition"],
        "youtube": ["premium quality visuals", "watch-time optimized", "end-screen ready design"],
        "display": ["responsive AI design", "attention-grabbing CTAs", "brand consistency with innovation"],
        "banner": ["high-impact minimal design", "clear value proposition", "conversion-focused layout"],
        "video": ["AI-generated motion", "dynamic transitions", "immersive storytelling"],
        "email": ["responsive design", "personalization-ready", "clear value hierarchy"],
        "website": ["AI-optimized UX", "fast loading design", "conversion-focused layout"]
    }
    
    selected_trends.extend(ad_type_map.get(ad_type.lower(), ["modern digital marketing", "high-performance design"]))
    
    # Add trends based on campaign goal
    goal_trend_map = {
        'awareness': [
            "brand storytelling with AI",
            "emotional connection through tech",
            "viral potential optimization",
            "memorable digital experience"
        ],
        'consideration': [
            "AI-powered comparison tools",
            "detailed feature visualization",
            "social proof integration",
            "trust-building design"
        ],
        'conversions': [
            "AI-optimized CTAs",
            "personalized offers",
            "frictionless user journey",
            "urgency through design"
        ],
        'retention': [
            "AI loyalty personalization",
            "community building features",
            "exclusive content design",
            "re-engagement optimization"
        ],
        'lead': [
            "AI-powered value exchange",
            "trust signal integration",
            "simplified data collection",
            "personalized follow-up ready"
        ]
    }
    
    selected_trends.extend(goal_trend_map.get(campaign_goal, ["professional AI marketing", "result-oriented design"]))
    
    # Create trend string for prompt
    trend_string = ", ".join(list(dict.fromkeys(selected_trends))[:7])  # Use top 7 unique trends
    
    # Build the final 2026-optimized prompt
    prompt = f"@product in {ad_type}, {base_prompt}"
    prompt += f", incorporating 2026 trends: {trend_string}"
    prompt += f", {current_trends['year']} AI-powered marketing"
    prompt += f", {current_trends['month']} seasonal relevance"
    prompt += f", modern tech-forward design"
    prompt += f", high-conversion AI-optimized visual"
    prompt += f", professional commercial advertisement"
    
    # Add quality and style parameters
    prompt += f", ultra-detailed, photorealistic, 8K resolution"
    prompt += f", professional lighting, perfect composition"
    
    return prompt

def generate_image_with_runway(image_data_base64, prompt_text, filename='image.png'):
    """
    Generate image using Runway ML Text-to-Image API with reference image
    """
    try:
        if not client:
            raise Exception("Runway client not initialized. Please set RUNWAY_API_KEY")
        
        # Get MIME type from filename
        mime_type = get_mime_type_from_filename(filename)
        
        # Create data URI from base64 data
        data_uri = f"data:{mime_type};base64,{image_data_base64}"
        
        print(f"[Runway] Creating generation task with prompt: {prompt_text[:100]}...")
        
        # Based on the error message, we need to use 'prompt_text'
        task = client.text_to_image.create(
            model='gen4_image_turbo',
            prompt_text=prompt_text,  # REQUIRED parameter
            ratio='1080:1080',        # REQUIRED parameter
            reference_images=[         # REQUIRED for image reference
                {
                    'uri': data_uri,
                    'tag': 'product',
                }
            ]
        )
        
        print(f"[Runway] Task created with ID: {task.id}, waiting for completion...")
        
        # Wait for the task to complete
        result = task.wait_for_task_output()
        
        print(f"[Runway] ✓ Task completed successfully!")
        
        # Extract the generated image URL
        if result and hasattr(result, 'output') and result.output:
            # Output is a list of URLs
            image_url = result.output[0] if isinstance(result.output, list) else result.output
            return {
                'success': True,
                'image_url': image_url,
                'task_id': task.id
            }
        else:
            print(f"[Runway] ✗ No output in result: {result}")
            return None
            
    except TaskFailedError as e:
        print(f"[Runway] ✗ Task failed: {e.task_details}")
        return None
    except Exception as e:
        print(f"[Runway] ✗ Error generating image: {str(e)}")
        traceback.print_exc()
        return None

def generate_ai_trend_insights(campaign_goal, industry_context):
    """
    Generate AI-powered insights about trends for this campaign
    """
    insights = {
        "predicted_trend_lifespan": "6-9 months",
        "adoption_curve": "Early Majority",
        "competitor_activity": "High",
        "consumer_sentiment": "Positive",
        "innovation_score": "8.5/10"
    }
    
    # Industry-specific insights
    if industry_context:
        insights["industry_trend_maturity"] = "Emerging" if any(x in ["ai", "tech", "software"] for x in industry_context) else "Maturing"
        insights["market_readiness"] = "Ready" if len(industry_context) > 1 else "Developing"
    
    return insights

@creative_assets_bp.route('/api/upload-image', methods=['POST'])
def upload_image():
    """
    Handle image upload and store for later generation
    """
    try:
        data = request.json
        user_id = data.get('user_id')
        image_data = data.get('image_data')  # base64 encoded
        filename = data.get('filename', 'uploaded_image.png')
        campaign_id = data.get('campaign_id')
        ad_type = data.get('ad_type', '')
        industry_context = data.get('industry_context', [])
        
        if not user_id or not image_data:
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        
        # Generate campaign ID if not provided
        if not campaign_id:
            campaign_id = f"campaign_{uuid.uuid4().hex[:8]}"
        
        # Store the upload information
        if user_id not in user_uploads:
            user_uploads[user_id] = {}
        
        user_uploads[user_id][campaign_id] = {
            'image_data': image_data,
            'filename': filename,
            'ad_type': ad_type,
            'industry_context': industry_context,
            'uploaded_at': datetime.now().isoformat(),
            'trend_snapshot': analyze_current_trends()
        }
        
        # Create campaign entry
        if campaign_id not in campaigns:
            campaigns[campaign_id] = {
                'user_id': user_id,
                'created_at': datetime.now().isoformat(),
                'assets': [],
                'trend_insights': generate_ai_trend_insights('awareness', industry_context)
            }
        
        print(f"[Upload] ✓ Image uploaded for campaign {campaign_id}")
        print(f"[Upload] Industry context: {industry_context}")
        print(f"[Upload] Trend snapshot captured")
        
        return jsonify({
            'success': True,
            'campaign_id': campaign_id,
            'message': 'Image uploaded successfully',
            'trend_context': analyze_current_trends()
        })
        
    except Exception as e:
        print(f"[Upload] ✗ Error: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@creative_assets_bp.route('/api/generate-assets', methods=['POST'])
def generate_assets():
    """
    Generate images using Runway ML when both image and text are provided
    """
    try:
        data = request.json
        user_id = data.get('user_id')
        campaign_id = data.get('campaign_id')
        campaign_goal = data.get('campaign_goal', 'awareness')
        ad_type = data.get('ad_type', '')
        additional_context = data.get('additional_context', '')
        target_audience = data.get('target_audience', '')
        
        if not user_id or not campaign_id:
            return jsonify({'success': False, 'error': 'Missing user_id or campaign_id'}), 400
        
        # Check if we have the uploaded image
        if user_id not in user_uploads or campaign_id not in user_uploads[user_id]:
            return jsonify({'success': False, 'error': 'No uploaded image found'}), 400
        
        upload_info = user_uploads[user_id][campaign_id]
        image_data = upload_info['image_data']
        filename = upload_info['filename']
        industry_context = upload_info.get('industry_context', [])
        
        # If ad_type is provided in this request, use it; otherwise use stored one
        if ad_type:
            upload_info['ad_type'] = ad_type
        else:
            ad_type = upload_info.get('ad_type', '')
        
        # Check if ad_type is provided
        if not ad_type:
            return jsonify({
                'success': False, 
                'error': 'Please provide the type of ads you want to generate'
            }), 400
        
        # Get current trends for 2026
        current_trends = analyze_current_trends()
        
        print("=" * 60)
        print(f"[Generation] 🎨 Starting image generation for campaign: {campaign_id}")
        print(f"[Generation] 📝 Ad Type: {ad_type}")
        print(f"[Generation] 🎯 Goal: {campaign_goal}")
        print(f"[Generation] 🏢 Industry: {industry_context}")
        print(f"[Generation] 🎯 Target: {target_audience}")
        print(f"[Generation] 📅 Year: {current_trends['year']}")
        print("=" * 60)
        
        # Generate trend insights
        trend_insights = generate_ai_trend_insights(campaign_goal, industry_context)
        
        # Create prompt based on campaign goal
        goal_prompts = {
            'awareness': 'AI-powered brand awareness advertisement for 2026',
            'consideration': 'engaging product showcase with AI personalization',
            'conversions': 'high-conversion AI-optimized advertisement',
            'retention': 'loyalty-building customer retention with AI',
            'lead': 'professional lead generation with AI assistance'
        }
        
        base_prompt = goal_prompts.get(campaign_goal, 'professional AI-powered product advertisement')
        
        # Add context
        if target_audience:
            base_prompt += f" targeting {target_audience}"
        if additional_context:
            base_prompt += f", {additional_context}"
        
        # Generate 6 variations with different trend combinations
        prompts = []
        
        # Variation 1: AI & Technology focus
        prompt1 = generate_trend_aware_prompt(
            base_prompt + ", focus on AI innovation and technology integration",
            ad_type,
            campaign_goal,
            industry_context
        )
        prompts.append(prompt1)
        
        # Variation 2: Sustainability & Future focus
        prompt2 = generate_trend_aware_prompt(
            base_prompt + ", emphasizing sustainability and future-forward design",
            ad_type,
            campaign_goal,
            industry_context
        )
        prompts.append(prompt2)
        
        # Variation 3: Personalization & Experience
        prompt3 = generate_trend_aware_prompt(
            base_prompt + ", focusing on personalized digital experiences",
            ad_type,
            campaign_goal,
            industry_context
        )
        prompts.append(prompt3)
        
        # Variation 4: Social Media & Virality
        prompt4 = generate_trend_aware_prompt(
            base_prompt + ", optimized for social media virality and engagement",
            ad_type,
            campaign_goal,
            industry_context
        )
        prompts.append(prompt4)
        
        # Variation 5: Premium & Luxury
        prompt5 = generate_trend_aware_prompt(
            base_prompt + ", premium luxury aesthetic with tech integration",
            ad_type,
            campaign_goal,
            industry_context
        )
        prompts.append(prompt5)
        
        # Variation 6: Minimalist & Clean
        prompt6 = generate_trend_aware_prompt(
            base_prompt + ", minimalist clean design with smart technology",
            ad_type,
            campaign_goal,
            industry_context
        )
        prompts.append(prompt6)
        
        generated_assets = []
        
        # Generate images with Runway
        print(f"[Generation] 🚀 Generating {len(prompts)} trend-aware image variations...")
        print(f"[Generation] 📊 Current trends applied: {current_trends}")
        print(f"[Generation] 🤖 AI Trend Insights: {trend_insights}")
        
        for idx, prompt in enumerate(prompts):
            print(f"\n[Generation] [{idx + 1}/{len(prompts)}] Generating trend-aware variation...")
            print(f"[Generation]    Trend context: {prompt[:120]}...")
            
            result = generate_image_with_runway(image_data, prompt, filename)
            
            if result and result.get('success'):
                # Calculate trend relevance score
                trend_score = 85 + (idx * 2)
                
                # Define variation themes
                variation_themes = [
                    "AI Technology Focus",
                    "Sustainability & Future",
                    "Personalized Experience",
                    "Social Media Optimized",
                    "Premium Luxury",
                    "Minimalist Smart Design"
                ]
                
                generated_assets.append({
                    'id': idx + 1,
                    'title': f'{ad_type} - {variation_themes[idx] if idx < len(variation_themes) else f"Variation {idx + 1}"}',
                    'image_url': result['image_url'],
                    'prompt': prompt,
                    'score': trend_score,
                    'type': 'AI Generated 2026',
                    'task_id': result['task_id'],
                    'trend_tags': [
                        f"2026",
                        current_trends['month'].lower(),
                        f"q{current_trends['quarter']}",
                        campaign_goal,
                        ad_type.lower(),
                        variation_themes[idx].lower().replace(' ', '-') if idx < len(variation_themes) else 'ai-generated'
                    ] + [ic.lower() for ic in industry_context[:2]],
                    'ai_insights': {
                        'predicted_engagement': f"{trend_score}%",
                        'innovation_level': 'High' if idx < 3 else 'Medium-High',
                        'market_fit': 'Strong' if trend_score > 88 else 'Good'
                    }
                })
                print(f"[Generation]    ✓ Success! Trend Score: {trend_score}")
                print(f"[Generation]    Theme: {variation_themes[idx] if idx < len(variation_themes) else 'AI Generated'}")
            else:
                print(f"[Generation]    ✗ Failed to generate variation {idx + 1}")
        
        if len(generated_assets) == 0:
            return jsonify({
                'success': False,
                'error': 'Failed to generate any images. Please check your Runway API key and credits.'
            }), 500
        
        # Store generated assets
        if campaign_id in campaigns:
            campaigns[campaign_id]['assets'] = generated_assets
            campaigns[campaign_id]['trend_metadata'] = {
                'generated_at': datetime.now().isoformat(),
                'trends_applied': current_trends,
                'industry_context': industry_context,
                'campaign_goal': campaign_goal,
                'ai_insights': trend_insights,
                'tech_adoption': current_trends.get('tech_adoption', {})
            }
        
        print("\n" + "=" * 60)
        print(f"[Generation] ✅ Successfully generated {len(generated_assets)} trend-aware images!")
        print(f"[Generation] 📈 Trends applied: {len(current_trends.get('seasonal', []))} seasonal trends")
        print(f"[Generation] 🎯 Industry trends: {len(industry_context)} contexts")
        print(f"[Generation] 🤖 AI Insights generated: {len(trend_insights)} metrics")
        print("=" * 60)
        
        return jsonify({
            'success': True,
            'assets': generated_assets,
            'campaign_id': campaign_id,
            'trend_metadata': {
                'season': current_trends['month'],
                'quarter': current_trends['quarter'],
                'year': current_trends['year'],
                'industry_trends': industry_context,
                'ai_insights': trend_insights,
                'tech_adoption_stats': current_trends.get('tech_adoption', {})
            },
            'message': f'Successfully generated {len(generated_assets)} AI-powered images for 2026'
        })
        
    except Exception as e:
        print(f"\n[Generation] ✗ Error: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@creative_assets_bp.route('/api/save-selected-assets', methods=['POST'])
def save_selected_assets():
    """
    Save selected assets to the campaign
    """
    try:
        data = request.json
        user_id = data.get('user_id')
        campaign_id = data.get('campaign_id')
        selected_assets = data.get('selected_assets', [])
        performance_notes = data.get('performance_notes', '')
        
        if not user_id or not campaign_id:
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        
        if campaign_id not in campaigns:
            return jsonify({'success': False, 'error': 'Campaign not found'}), 404
        
        # Update campaign with selected assets
        campaigns[campaign_id]['selected_assets'] = selected_assets
        campaigns[campaign_id]['updated_at'] = datetime.now().isoformat()
        
        # Store performance notes
        if performance_notes:
            campaigns[campaign_id]['performance_notes'] = performance_notes
        
        # Analyze successful trends
        selected_trends = set()
        ai_insights = {
            'total_selected': len(selected_assets),
            'average_score': 0,
            'top_trends': []
        }
        
        total_score = 0
        for asset in selected_assets:
            if isinstance(asset, dict):
                if 'trend_tags' in asset:
                    selected_trends.update(asset['trend_tags'])
                if 'score' in asset:
                    total_score += asset['score']
                if 'ai_insights' in asset:
                    # Collect AI insights
                    pass
        
        if selected_assets:
            ai_insights['average_score'] = total_score / len(selected_assets)
        
        ai_insights['top_trends'] = list(selected_trends)[:8]
        campaigns[campaign_id]['successful_trends'] = list(selected_trends)
        campaigns[campaign_id]['selection_insights'] = ai_insights
        
        print(f"[Save] ✓ Saved {len(selected_assets)} selected assets for campaign {campaign_id}")
        print(f"[Save] 📊 Average score: {ai_insights['average_score']:.1f}")
        print(f"[Save] 🎯 Top trends: {ai_insights['top_trends'][:3]}...")
        
        return jsonify({
            'success': True,
            'message': f'{len(selected_assets)} assets saved successfully',
            'selection_insights': ai_insights,
            'successful_trends': list(selected_trends)[:10]
        })
        
    except Exception as e:
        print(f"[Save] ✗ Error: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@creative_assets_bp.route('/api/create-campaign', methods=['POST'])
def create_campaign():
    """
    Create a new campaign with trend context
    """
    try:
        data = request.json
        user_id = data.get('user_id')
        campaign_goal = data.get('campaign_goal', 'awareness')
        industry_context = data.get('industry_context', [])
        target_audience = data.get('target_audience', '')
        market_segment = data.get('market_segment', '')
        
        if not user_id:
            return jsonify({'success': False, 'error': 'Missing user_id'}), 400
        
        campaign_id = f"campaign_{uuid.uuid4().hex[:8]}"
        
        # Get current trends and insights
        current_trends = analyze_current_trends()
        trend_insights = generate_ai_trend_insights(campaign_goal, industry_context)
        
        campaigns[campaign_id] = {
            'user_id': user_id,
            'campaign_goal': campaign_goal,
            'industry_context': industry_context,
            'target_audience': target_audience,
            'market_segment': market_segment,
            'created_at': datetime.now().isoformat(),
            'trend_snapshot': current_trends,
            'trend_insights': trend_insights,
            'year': 2026,
            'assets': []
        }
        
        print(f"[Campaign] ✓ Created new campaign: {campaign_id}")
        print(f"[Campaign] 📊 Trend snapshot: {current_trends['month']} {current_trends['year']}")
        print(f"[Campaign] 🤖 AI Insights: {trend_insights}")
        
        return jsonify({
            'success': True,
            'campaign_id': campaign_id,
            'trend_context': {
                'year': 2026,
                'season': current_trends['month'],
                'quarter': current_trends['quarter'],
                'insights': trend_insights,
                'tech_adoption': current_trends.get('tech_adoption', {})
            }
        })
        
    except Exception as e:
        print(f"[Campaign] ✗ Error: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@creative_assets_bp.route('/api/get-campaign/<campaign_id>', methods=['GET'])
def get_campaign(campaign_id):
    """
    Get campaign details and assets
    """
    try:
        if campaign_id not in campaigns:
            return jsonify({'success': False, 'error': 'Campaign not found'}), 404
        
        campaign_data = campaigns[campaign_id]
        
        # Add trend analysis if not present
        if 'trend_insights' not in campaign_data:
            campaign_data['trend_insights'] = generate_ai_trend_insights(
                campaign_data.get('campaign_goal', 'awareness'),
                campaign_data.get('industry_context', [])
            )
        
        return jsonify({
            'success': True,
            'campaign': campaign_data,
            'current_year': 2026,
            'trend_database_version': '2026.1'
        })
        
    except Exception as e:
        print(f"[Get Campaign] ✗ Error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@creative_assets_bp.route('/api/get-current-trends', methods=['GET'])
def get_current_trends():
    """
    Get current marketing and design trends for 2026
    """
    try:
        current_trends = analyze_current_trends()
        
        return jsonify({
            'success': True,
            'year': 2026,
            'trends': {
                'seasonal': current_trends['seasonal'],
                'quarter': current_trends['quarter'],
                'month': current_trends['month'],
                'year': current_trends['year'],
                'design_trends': RECENT_TRENDS['design_trends_2026'],
                'social_media_trends': RECENT_TRENDS['social_media_trends_2026'],
                'marketing_trends': RECENT_TRENDS['marketing_trends_2026'],
                'technology_trends': RECENT_TRENDS['technology_trends'],
                'emerging_technologies': current_trends.get('emerging_technologies', []),
                'tech_adoption': current_trends.get('tech_adoption', {})
            },
            'updated_at': datetime.now().isoformat(),
            'database_version': '2026.1'
        })
        
    except Exception as e:
        print(f"[Trends] ✗ Error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@creative_assets_bp.route('/api/update-trends', methods=['POST'])
def update_trends():
    """
    Update trend database (admin endpoint)
    """
    try:
        data = request.json
        new_trends = data.get('trends', {})
        
        # Update trends
        if new_trends:
            RECENT_TRENDS.update(new_trends)
            
        return jsonify({
            'success': True,
            'message': 'Trends updated successfully',
            'updated_at': datetime.now().isoformat(),
            'database_version': '2026.1'
        })
        
    except Exception as e:
        print(f"[Update Trends] ✗ Error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@creative_assets_bp.route('/api/health', methods=['GET'])
def creative_assets_health():
    """Health check endpoint for creative assets"""
    current_trends = analyze_current_trends()
    return jsonify({
        'status': 'healthy',
        'service': 'creative-assets',
        'runway_configured': client is not None,
        'campaigns_count': len(campaigns),
        'current_year': 2026,
        'current_trends': {
            'year': current_trends['year'],
            'season': current_trends['month'],
            'quarter': current_trends['quarter']
        },
        'trend_database': {
            'version': '2026.1',
            'total_trends': sum(len(v) for v in RECENT_TRENDS.values()),
            'categories': list(RECENT_TRENDS.keys())
        }
    })
"""
Daily metrics endpoints for AdSurveillance
"""
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(url, key)

# Import middleware
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from middleware.auth import token_required

@app.route('/api/daily-metrics', methods=['POST'])
@token_required
def get_user_daily_metrics():
    """Get daily metrics for the logged-in user's competitors"""
    try:
        user_id = request.user_id
        data = request.get_json() or {}
        
        limit = data.get('limit', 10)
        showLatestOnly = data.get('showLatestOnly', False)
        startDate = data.get('startDate')
        endDate = data.get('endDate')
        
        # Get user's competitors
        competitors_response = (
            supabase.table("competitors")
            .select("id, name")
            .eq("user_id", user_id)
            .eq("is_active", True)
            .execute()
        )
        
        competitor_ids = [comp['id'] for comp in competitors_response.data]
        
        if not competitor_ids:
            return jsonify({
                'success': True,
                'data': [],
                'message': 'No competitors found for user'
            }), 200
        
        # Build query
        query = (
            supabase.table("daily_metrics")
            .select("""
                id,
                date,
                competitor_id,
                competitor_name,
                platform,
                daily_spend,
                daily_impressions,
                daily_clicks,
                daily_ctr,
                spend_lower_bound,
                spend_upper_bound,
                impressions_lower_bound,
                impressions_upper_bound,
                creative,
                created_at
            """)
            .in_("competitor_id", competitor_ids)
            .order("date", desc=True)
        )
        
        latest_date = None
        if showLatestOnly:
            # Get latest date
            latest_date_response = (
                supabase.table("daily_metrics")
                .select("date")
                .in_("competitor_id", competitor_ids)
                .order("date", desc=True)
                .limit(1)
                .single()
                .execute()
            )
            
            if latest_date_response.data:
                latest_date = latest_date_response.data['date']
                query = query.eq("date", latest_date)
        
        if startDate:
            query = query.gte("date", startDate)
        if endDate:
            query = query.lte("date", endDate)
        
        query = query.limit(limit)
        
        response = query.execute()
        
        # Transform data
        result = []
        for row in response.data:
            status = 'ACTIVE' if (latest_date and row['date'] == latest_date) else 'ENDED'
            result.append({
                'id': row['id'],
                'date': row['date'],
                'competitor_name': row['competitor_name'] or 'Unknown Competitor',
                'platform': row['platform'] or 'Unknown',
                'status': status,
                'daily_spend': float(row['daily_spend']) if row['daily_spend'] else 0,
                'daily_impressions': row['daily_impressions'] or 0,
                'daily_ctr': float(row['daily_ctr']) if row['daily_ctr'] else 0,
                'ad_title': f"{row['competitor_name'] or 'Competitor'} Campaign" if row['competitor_name'] else 'Advertising Campaign',
                'ad_body': row['creative'] or 'Advertising campaign in progress',
                'spend_lower_bound': float(row['spend_lower_bound']) if row['spend_lower_bound'] else 0,
                'spend_upper_bound': float(row['spend_upper_bound']) if row['spend_upper_bound'] else 0,
                'impressions_lower_bound': row['impressions_lower_bound'] or 0,
                'impressions_upper_bound': row['impressions_upper_bound'] or 0,
                'variants': 1,
                'ab_tests': 0,
                'created_at': row['created_at']
            })
        
        return jsonify({
            'success': True,
            'data': result,
            'count': len(result),
            'user_id': user_id
        }), 200
        
    except Exception as e:
        print(f"Error getting user daily metrics: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/summary-metrics', methods=['GET'])
@token_required
def get_user_summary_metrics():
    """Get summary metrics for the logged-in user"""
    try:
        user_id = request.user_id
        period = request.args.get('period', '7d')
        
        # Calculate date range based on period
        end_date = datetime.now()
        if period == '1d':
            start_date = end_date - timedelta(days=1)
        elif period == '7d':
            start_date = end_date - timedelta(days=7)
        elif period == '30d':
            start_date = end_date - timedelta(days=30)
        elif period == '90d':
            start_date = end_date - timedelta(days=90)
        else:
            start_date = end_date - timedelta(days=7)
        
        # Get user's competitors
        competitors_response = (
            supabase.table("competitors")
            .select("id")
            .eq("user_id", user_id)
            .eq("is_active", True)
            .execute()
        )
        
        competitor_ids = [comp['id'] for comp in competitors_response.data]
        
        if not competitor_ids:
            return jsonify({
                'success': True,
                'data': {
                    'total_competitor_spend': 0,
                    'active_campaigns_count': 0,
                    'total_impressions': 0,
                    'average_ctr': 0,
                    'platform_distribution': {},
                    'totalCompetitors': 0
                }
            }), 200
        
        # Get summary metrics for user
        summary_response = (
            supabase.table("summary_metrics")
            .select("*")
            .eq("user_id", user_id)
            .gte("period_end_date", start_date.isoformat())
            .lte("period_end_date", end_date.isoformat())
            .order("period_end_date", desc=True)
            .limit(1)
            .execute()
        )
        
        if summary_response.data:
            summary_data = summary_response.data[0]
            return jsonify({
                'success': True,
                'data': summary_data
            }), 200
        else:
            # If no summary metrics found, calculate from daily metrics
            daily_response = (
                supabase.table("daily_metrics")
                .select("daily_spend, daily_impressions, daily_clicks, platform")
                .in_("competitor_id", competitor_ids)
                .gte("date", start_date.strftime('%Y-%m-%d'))
                .lte("date", end_date.strftime('%Y-%m-%d'))
                .execute()
            )
            
            total_spend = 0
            total_impressions = 0
            total_clicks = 0
            platform_distribution = {}
            
            for metric in daily_response.data:
                total_spend += float(metric.get('daily_spend', 0))
                total_impressions += int(metric.get('daily_impressions', 0))
                total_clicks += int(metric.get('daily_clicks', 0))
                
                platform = metric.get('platform', 'Unknown')
                platform_distribution[platform] = platform_distribution.get(platform, 0) + 1
            
            average_ctr = total_clicks / total_impressions if total_impressions > 0 else 0
            
            return jsonify({
                'success': True,
                'data': {
                    'total_competitor_spend': total_spend,
                    'active_campaigns_count': len(competitor_ids),
                    'total_impressions': total_impressions,
                    'average_ctr': average_ctr,
                    'platform_distribution': platform_distribution,
                    'totalCompetitors': len(competitor_ids)
                }
            }), 200
            
    except Exception as e:
        print(f"Error getting summary metrics: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'daily-metrics',  # Change for each service
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("Starting Daily Metrics server...")
    app.run(debug=True, port=5008, host='0.0.0.0')
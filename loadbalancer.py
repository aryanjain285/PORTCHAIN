import pandas as pd
import requests
import json
from datetime import datetime, timedelta
import time
import random
from fuzzywuzzy import fuzz
import numpy as np
from scipy.optimize import linprog
from scipy.sparse import lil_matrix
import os
from flask import Flask, request, send_file
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


# Constants
NEWSAPI_KEY = 'e3d6eb5452ac4bfabba25982e98c07d2'
GROQ_API_KEY = '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'
NEWSAPI_ENDPOINT = 'https://newsapi.org/v2/everything'
GROQ_API_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'



# News analysis functions
def fetch_port_news(start_date, end_date):
    """Fetch port-related news for a date range"""
    query = (
        '(port OR seaport OR harbor OR "container terminal") AND '
        '(capacity OR congestion OR efficiency OR "throughput volume" OR '
        '"operational disruption" OR "weather impact" OR "equipment failure" OR '
        '"labor shortage" OR "new technology" OR expansion)'
    )
    params = {
        'q': query,
        'from': start_date,
        'to': end_date,
        'sortBy': 'relevancy',
        'apiKey': NEWSAPI_KEY,
        'language': 'en',
        'pageSize': 10
   
    }
    print(f"Debug: Sending request to NewsAPI with params: {params}")
    try:
        response = requests.get(NEWSAPI_ENDPOINT, params=params)
        response.raise_for_status()
        data = response.json()
        print(f"Debug: NewsAPI response status: {response.status_code}")
        print(f"Debug: NewsAPI response data: {json.dumps(data, indent=2)}")
        return data.get('articles', [])
    except requests.exceptions.RequestException as e:
        print(f"An error occurred while fetching news: {e}")
        print(f"Debug: Full error details: {str(e)}")
        return []

def analyze_operational_impact(text, max_retries=5):
    """Analyze operational impact of news using Groq API with rate limiting and retries"""
    headers = {
        'Authorization': f'Bearer {GROQ_API_KEY}',
        'Content-Type': 'application/json'
    }
    schema = '''{
      "operational_analysis": {
        "impact_score": "number (0 or 1)",
        "affected_ports": [
          {
            "name": "string",
            "country": "string",
            "impact_level": "string (negative, neutral, positive)"
          }
        ]
      }
    }'''
    
    prompt = f'''You are an expert in port operations and logistics. Analyze the following news article text and provide an operational impact analysis for a port load balancing system. Your analysis should follow this JSON schema:

    {schema}

    Guidelines:
    1. impact_score: Use 1 for any negative impact, and 0 for neutral or positive impact.
    2. affected_ports: List specific ports mentioned or likely to be affected, including their name, country, and level of impact (negative, neutral, or positive).

    Consider factors like port capacity, efficiency, congestion, equipment status, weather impacts, and technological improvements. Focus on how the news might affect load balancing across multiple ports.

    Respond only with a valid JSON object that matches the schema.'''

    data = {
        'model': 'llama-3.1-70b-versatile',
        'messages': [
            {'role': 'system', 'content': prompt},
            {'role': 'user', 'content': text}
        ],
        'response_format': {'type': 'json_object'},
        'max_tokens': 500
    }

    print(f"Debug: Sending request to Groq API")
    for attempt in range(max_retries):
        try:
            response = requests.post(GROQ_API_ENDPOINT, headers=headers, json=data)
            response.raise_for_status()
            
            
            content = json.loads(response.json()['choices'][0]['message']['content'])
            return content
        except requests.exceptions.RequestException as e:
            if response.status_code == 429:
                wait_time = (2 ** attempt) + random.random()  # Exponential backoff with jitter
                print(f"Rate limit hit. Retrying in {wait_time:.2f} seconds...")
                time.sleep(wait_time)
            else:
                print(f"An error occurred during operational analysis: {e}")
                print(f"Debug: Full error details: {str(e)}")
                return {}
        except (json.JSONDecodeError, KeyError) as e:
            print(f"An error occurred while processing the response: {e}")
            print(f"Debug: Full error details: {str(e)}")
            return {}

    print("Max retries reached. Could not complete analysis.")
    return {}

def process_news_with_operational_analysis(articles):
    """Process news articles and add operational impact analysis"""
    processed_articles = []
    for i, article in enumerate(articles):
        print(f"Processing article {i+1}/{len(articles)}")
        analysis_data = analyze_operational_impact(article['title'] + " " + article.get('description', ''))
        article['operational_analysis'] = analysis_data.get('operational_analysis', {})
        processed_articles.append(article)
        time.sleep(2)  # Add a 2-second delay between each article processing
    return processed_articles

def fuzzy_match_port(port_name, ports_df, threshold=80):
    """Find the best match for a port name in the ports DataFrame"""
    best_match = None
    best_score = 0
    for _, row in ports_df.iterrows():
        score = fuzz.ratio(port_name.lower(), row['portname'].lower())
        if score > best_score and score >= threshold:
            best_score = score
            best_match = row
    return best_match

def process_data(json_data, ports_df):
    """Process JSON data to calculate impact scores"""
    port_impacts = {}

    for article in json_data['articles']:
        if 'operational_analysis' in article and 'affected_ports' in article['operational_analysis']:
            for port in article['operational_analysis']['affected_ports']:
                port_name = port['name']
                impact_level = port['impact_level']
                
                matched_port = fuzzy_match_port(port_name, ports_df)
                if matched_port is not None:
                    port_id = matched_port['portid']
                    if port_id not in port_impacts:
                        port_impacts[port_id] = []
                    port_impacts[port_id].append(1 if impact_level == 'negative' else 0)

    # Calculate final impact scores (1 if any negative impact, 0 otherwise)
    for port_id, scores in port_impacts.items():
        port_impacts[port_id] = 1 if any(scores) else 0

    return port_impacts

def update_ports_with_impacts(ports_df, impacts):
    """Update ports DataFrame with impact scores"""
    ports_df['impact_score'] = ports_df['portid'].map(impacts).fillna(0).astype(int)
    return ports_df

# Cargo redistribution functions
def run_kmeans_clustering(df):
    """Run K-means clustering on the updated dataset"""
    # Select numerical columns for clustering
    numerical_columns = ['vessel_count_total', 'vessel_count_container', 'vessel_count_dry_bulk',
                         'vessel_count_general_cargo', 'vessel_count_RoRo', 'vessel_count_tanker',
                         'share_country_maritime_import', 'share_country_maritime_export',
                         'portcalls_container', 'portcalls_dry_bulk', 'portcalls_general_cargo',
                         'portcalls_roro', 'portcalls_tanker', 'portcalls_cargo', 'portcalls',
                         'import_container', 'import_dry_bulk', 'import_general_cargo', 'import_roro',
                         'import_tanker', 'import_cargo', 'import', 'export_container', 'export_dry_bulk',
                         'export_general_cargo', 'export_roro', 'export_tanker', 'export_cargo', 'export',
                         'impact_score']

    # Encode categorical columns
    categorical_columns = ['ISO3', 'continent', 'industry_top1', 'industry_top2', 'industry_top3']
    df_encoded = pd.get_dummies(df, columns=categorical_columns)

    # Prepare data for clustering
    X = df_encoded[numerical_columns + [col for col in df_encoded.columns if col.startswith(tuple(categorical_columns))]]
    
    # Impute missing values
    imputer = SimpleImputer(strategy='constant', fill_value=0)
    X_imputed = imputer.fit_transform(X)

    # Standardize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_imputed)

    # Perform K-means clustering
    kmeans = KMeans(n_clusters=5, random_state=42)
    df['resilience_cluster'] = kmeans.fit_predict(X_scaled)

    return df

def prioritize_disrupted(group):
    disrupted = group[group['disaster_indicator'] == 1]
    if not disrupted.empty:
        return disrupted.iloc[0]
    return group.iloc[0]

def prepare_data_for_redistribution(df):
    """Prepare the data for redistribution calculations."""
    disrupted_ports = df[df['disaster_indicator'] == 1]
    non_disrupted_ports = df[df['disaster_indicator'] == 0]
    
    non_disrupted_ports.loc[:, 'available_capacity'] = np.maximum(
        non_disrupted_ports['vessel_count_total'] - non_disrupted_ports['import'], 0
    )
    
    return disrupted_ports, non_disrupted_ports

def redistribute_cargo(disrupted_ports, non_disrupted_ports):
    available_capacity = non_disrupted_ports['available_capacity'].values
    total_cargo_to_redistribute = disrupted_ports['export'].sum()
    total_available_capacity = non_disrupted_ports['available_capacity'].sum()

    print(f"Total cargo to redistribute: {total_cargo_to_redistribute}")
    print(f"Total available capacity: {total_available_capacity}")

    if total_cargo_to_redistribute > total_available_capacity:
        print("Warning: Total cargo exceeds available capacity. Problem may be infeasible.")
    else:
        print("Proceeding with cargo redistribution.")

    batch_size = 10
    cargo_redistributed_total = np.zeros((len(disrupted_ports), len(non_disrupted_ports)))

    for batch_start in range(0, len(disrupted_ports), batch_size):
        batch_end = min(batch_start + batch_size, len(disrupted_ports))
        disrupted_ports_batch = disrupted_ports.iloc[batch_start:batch_end]

        cargo_to_redistribute_batch = disrupted_ports_batch['export'].values
        cost_matrix_batch = np.random.rand(len(disrupted_ports_batch), len(non_disrupted_ports)).astype(np.float32)

        c = cost_matrix_batch.flatten()
        A_eq = lil_matrix((len(cargo_to_redistribute_batch), len(c)))
        for i in range(len(cargo_to_redistribute_batch)):
            A_eq[i, i * len(non_disrupted_ports):(i + 1) * len(non_disrupted_ports)] = 1

        b_eq = cargo_to_redistribute_batch
        A_ub = lil_matrix((len(non_disrupted_ports), len(c)))
        for j in range(len(non_disrupted_ports)):
            A_ub[j, j::len(non_disrupted_ports)] = 1

        b_ub = available_capacity
        res = linprog(c, A_ub=A_ub.tocsr(), b_ub=b_ub, A_eq=A_eq.tocsr(), b_eq=b_eq, method='highs')

        if res.success:
            cargo_redistributed_batch = res.x.reshape(len(disrupted_ports_batch), len(non_disrupted_ports))
            cargo_redistributed_total[batch_start:batch_end, :] = cargo_redistributed_batch
        else:
            print(f"Batch from {batch_start} to {batch_end} failed to solve: {res.message}")

    return cargo_redistributed_total

def update_redistribution_results(disrupted_ports, non_disrupted_ports, cargo_redistributed_total):
    """Update the dataframes with redistribution results."""
    disrupted_ports.loc[:, 'cargo_redistributed'] = np.sum(cargo_redistributed_total, axis=1)
    non_disrupted_ports.loc[:, 'cargo_received'] = np.sum(cargo_redistributed_total, axis=0)
    return disrupted_ports, non_disrupted_ports

def process_ports(start_date, end_date, grouped_ports_path, port_names_path):
    print(f"Processing ports from {start_date} to {end_date}")
    
    # Load and merge data
    grouped_ports_df = pd.read_csv(grouped_ports_path)
    port_names_df = pd.read_csv(port_names_path)
    merged_ports_df = pd.merge(grouped_ports_df, port_names_df[['portid', 'portname']], on='portid', how='left')
    print(f"Loaded and merged data: {merged_ports_df.shape[0]} ports")

    # Fetch and process news
    news = fetch_port_news(start_date, end_date)
    processed_news = process_news_with_operational_analysis(news)
    print(f"Processed {len(processed_news)} news articles")

    # Calculate and apply impact scores
    impacts = process_data({"articles": processed_news}, merged_ports_df)
    updated_ports_df = update_ports_with_impacts(merged_ports_df, impacts)
    print(f"Updated {len(impacts)} ports with impact scores")

    # Run K-means clustering
    updated_ports_df = run_kmeans_clustering(updated_ports_df)
    print("Performed K-means clustering")

    # Group and prioritize ports
    grouped_ports = updated_ports_df.groupby('portid').apply(prioritize_disrupted).reset_index(drop=True)
    print("Grouped and prioritized ports")

    # Prepare for redistribution
    disrupted_ports, non_disrupted_ports = prepare_data_for_redistribution(grouped_ports)
    print(f"Identified {len(disrupted_ports)} disrupted ports")

    # Redistribute cargo
    cargo_redistributed_total = redistribute_cargo(disrupted_ports, non_disrupted_ports)
    print("Completed cargo redistribution")

    # Update results
    disrupted_ports, non_disrupted_ports = update_redistribution_results(disrupted_ports, non_disrupted_ports, cargo_redistributed_total)
    final_results = pd.concat([disrupted_ports, non_disrupted_ports])
    print(f"Final results: {final_results.shape[0]} ports processed")

    return final_results

# Flask route


@app.route('/process', methods=['POST'])
def process():
    data = request.json
    print(f"Debug: Received request with data: {data}")
    start_date = datetime.fromisoformat(data['start_date'])
    end_date = datetime.fromisoformat(data['end_date'])
    grouped_ports_path = './public/grouped_ports.csv'
    port_names_path = './public/portnames.csv'

    results = process_ports(start_date, end_date, grouped_ports_path, port_names_path)

    output_file = './public/result.csv'
    results.to_csv(output_file, index=False)
    print(f"Debug: Saved results to {output_file}")

    return send_file(output_file, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
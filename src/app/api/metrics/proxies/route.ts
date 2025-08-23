import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const timestamp = Date.now();

    const proxyMetrics = `# HELP datavault_proxy_pool_size Total proxy pool size by provider
# TYPE datavault_proxy_pool_size gauge
datavault_proxy_pool_size{provider="brightdata",type="residential"} ${Math.floor(Math.random() * 1000) + 500} ${timestamp}
datavault_proxy_pool_size{provider="brightdata",type="datacenter"} ${Math.floor(Math.random() * 500) + 200} ${timestamp}
datavault_proxy_pool_size{provider="oxylabs",type="residential"} ${Math.floor(Math.random() * 800) + 400} ${timestamp}
datavault_proxy_pool_size{provider="iproyal",type="residential"} ${Math.floor(Math.random() * 600) + 300} ${timestamp}
datavault_proxy_pool_size{provider="smartproxy",type="datacenter"} ${Math.floor(Math.random() * 400) + 200} ${timestamp}

# HELP datavault_proxy_success_rate Success rate of proxy requests
# TYPE datavault_proxy_success_rate gauge
datavault_proxy_success_rate{provider="brightdata"} ${(Math.random() * 0.1 + 0.9).toFixed(3)} ${timestamp}
datavault_proxy_success_rate{provider="oxylabs"} ${(Math.random() * 0.1 + 0.88).toFixed(3)} ${timestamp}
datavault_proxy_success_rate{provider="iproyal"} ${(Math.random() * 0.15 + 0.85).toFixed(3)} ${timestamp}
datavault_proxy_success_rate{provider="smartproxy"} ${(Math.random() * 0.1 + 0.92).toFixed(3)} ${timestamp}

# HELP datavault_proxy_response_time_seconds Proxy response time in seconds
# TYPE datavault_proxy_response_time_seconds histogram
datavault_proxy_response_time_seconds_bucket{provider="brightdata",le="1"} ${Math.floor(Math.random() * 100) + 50} ${timestamp}
datavault_proxy_response_time_seconds_bucket{provider="brightdata",le="5"} ${Math.floor(Math.random() * 200) + 100} ${timestamp}
datavault_proxy_response_time_seconds_bucket{provider="brightdata",le="10"} ${Math.floor(Math.random() * 250) + 150} ${timestamp}
datavault_proxy_response_time_seconds_bucket{provider="brightdata",le="+Inf"} ${Math.floor(Math.random() * 300) + 200} ${timestamp}

# HELP datavault_proxy_cost_per_request_usd Cost per request in USD
# TYPE datavault_proxy_cost_per_request_usd gauge
datavault_proxy_cost_per_request_usd{provider="brightdata"} ${(Math.random() * 0.01 + 0.005).toFixed(6)} ${timestamp}
datavault_proxy_cost_per_request_usd{provider="oxylabs"} ${(Math.random() * 0.008 + 0.004).toFixed(6)} ${timestamp}
datavault_proxy_cost_per_request_usd{provider="iproyal"} ${(Math.random() * 0.006 + 0.003).toFixed(6)} ${timestamp}
datavault_proxy_cost_per_request_usd{provider="smartproxy"} ${(Math.random() * 0.007 + 0.0035).toFixed(6)} ${timestamp}

# HELP datavault_proxy_geographic_distribution Proxy distribution by country
# TYPE datavault_proxy_geographic_distribution gauge
datavault_proxy_geographic_distribution{country="US"} ${Math.floor(Math.random() * 500) + 200} ${timestamp}
datavault_proxy_geographic_distribution{country="UK"} ${Math.floor(Math.random() * 200) + 100} ${timestamp}
datavault_proxy_geographic_distribution{country="DE"} ${Math.floor(Math.random() * 150) + 75} ${timestamp}
datavault_proxy_geographic_distribution{country="FR"} ${Math.floor(Math.random() * 120) + 60} ${timestamp}
datavault_proxy_geographic_distribution{country="CA"} ${Math.floor(Math.random() * 100) + 50} ${timestamp}

# HELP datavault_proxy_bandwidth_usage_bytes Total bandwidth usage by provider
# TYPE datavault_proxy_bandwidth_usage_bytes counter
datavault_proxy_bandwidth_usage_bytes{provider="brightdata"} ${Math.floor(Math.random() * 5000000000) + 2000000000} ${timestamp}
datavault_proxy_bandwidth_usage_bytes{provider="oxylabs"} ${Math.floor(Math.random() * 3000000000) + 1500000000} ${timestamp}
datavault_proxy_bandwidth_usage_bytes{provider="iproyal"} ${Math.floor(Math.random() * 2000000000) + 1000000000} ${timestamp}

# HELP datavault_proxy_rotation_rate Proxy rotation rate per minute
# TYPE datavault_proxy_rotation_rate gauge
datavault_proxy_rotation_rate{provider="brightdata"} ${Math.floor(Math.random() * 50) + 20} ${timestamp}
datavault_proxy_rotation_rate{provider="oxylabs"} ${Math.floor(Math.random() * 40) + 15} ${timestamp}
datavault_proxy_rotation_rate{provider="iproyal"} ${Math.floor(Math.random() * 60) + 25} ${timestamp}

# HELP datavault_proxy_health_check_failures Total proxy health check failures
# TYPE datavault_proxy_health_check_failures counter
datavault_proxy_health_check_failures{provider="brightdata"} ${Math.floor(Math.random() * 10) + 2} ${timestamp}
datavault_proxy_health_check_failures{provider="oxylabs"} ${Math.floor(Math.random() * 8) + 1} ${timestamp}
datavault_proxy_health_check_failures{provider="iproyal"} ${Math.floor(Math.random() * 15) + 5} ${timestamp}

# HELP datavault_proxy_concurrent_connections Current concurrent connections
# TYPE datavault_proxy_concurrent_connections gauge
datavault_proxy_concurrent_connections{provider="brightdata"} ${Math.floor(Math.random() * 100) + 50} ${timestamp}
datavault_proxy_concurrent_connections{provider="oxylabs"} ${Math.floor(Math.random() * 80) + 40} ${timestamp}
datavault_proxy_concurrent_connections{provider="iproyal"} ${Math.floor(Math.random() * 60) + 30} ${timestamp}
`;

    return new NextResponse(proxyMetrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating proxy metrics:', error);
    return NextResponse.json(
      { error: 'Failed to generate proxy metrics' },
      { status: 500 }
    );
  }
}

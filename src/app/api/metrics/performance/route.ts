import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const timestamp = Date.now();

    const performanceMetrics = `# HELP datavault_performance_cpu_usage CPU usage percentage
# TYPE datavault_performance_cpu_usage gauge
datavault_performance_cpu_usage ${(Math.random() * 50 + 20).toFixed(2)} ${timestamp}

# HELP datavault_performance_memory_usage Memory usage percentage
# TYPE datavault_performance_memory_usage gauge
datavault_performance_memory_usage ${(Math.random() * 40 + 30).toFixed(2)} ${timestamp}

# HELP datavault_performance_disk_io_rate Disk I/O rate in bytes per second
# TYPE datavault_performance_disk_io_rate gauge
datavault_performance_disk_io_rate{operation="read"} ${Math.floor(Math.random() * 10000000) + 5000000} ${timestamp}
datavault_performance_disk_io_rate{operation="write"} ${Math.floor(Math.random() * 5000000) + 2000000} ${timestamp}

# HELP datavault_performance_network_throughput Network throughput in bytes per second
# TYPE datavault_performance_network_throughput gauge
datavault_performance_network_throughput{direction="inbound"} ${Math.floor(Math.random() * 50000000) + 20000000} ${timestamp}
datavault_performance_network_throughput{direction="outbound"} ${Math.floor(Math.random() * 30000000) + 15000000} ${timestamp}

# HELP datavault_performance_database_query_time Average database query time in milliseconds
# TYPE datavault_performance_database_query_time histogram
datavault_performance_database_query_time_bucket{le="10"} ${Math.floor(Math.random() * 100) + 50} ${timestamp}
datavault_performance_database_query_time_bucket{le="50"} ${Math.floor(Math.random() * 200) + 100} ${timestamp}
datavault_performance_database_query_time_bucket{le="100"} ${Math.floor(Math.random() * 300) + 150} ${timestamp}
datavault_performance_database_query_time_bucket{le="500"} ${Math.floor(Math.random() * 350) + 200} ${timestamp}
datavault_performance_database_query_time_bucket{le="+Inf"} ${Math.floor(Math.random() * 400) + 250} ${timestamp}
datavault_performance_database_query_time_sum ${(Math.random() * 5000 + 2000).toFixed(3)} ${timestamp}
datavault_performance_database_query_time_count ${Math.floor(Math.random() * 400) + 250} ${timestamp}

# HELP datavault_performance_cache_hit_ratio Cache hit ratio
# TYPE datavault_performance_cache_hit_ratio gauge
datavault_performance_cache_hit_ratio{cache_type="redis"} ${(Math.random() * 0.2 + 0.8).toFixed(3)} ${timestamp}
datavault_performance_cache_hit_ratio{cache_type="memory"} ${(Math.random() * 0.15 + 0.85).toFixed(3)} ${timestamp}

# HELP datavault_performance_queue_depth Current queue depth
# TYPE datavault_performance_queue_depth gauge
datavault_performance_queue_depth{queue="scraper"} ${Math.floor(Math.random() * 200) + 50} ${timestamp}
datavault_performance_queue_depth{queue="export"} ${Math.floor(Math.random() * 50) + 10} ${timestamp}
datavault_performance_queue_depth{queue="notification"} ${Math.floor(Math.random() * 20) + 5} ${timestamp}

# HELP datavault_performance_api_latency API endpoint latency in milliseconds
# TYPE datavault_performance_api_latency histogram
datavault_performance_api_latency_bucket{endpoint="/api/scrapers",le="100"} ${Math.floor(Math.random() * 80) + 40} ${timestamp}
datavault_performance_api_latency_bucket{endpoint="/api/scrapers",le="500"} ${Math.floor(Math.random() * 120) + 60} ${timestamp}
datavault_performance_api_latency_bucket{endpoint="/api/scrapers",le="1000"} ${Math.floor(Math.random() * 140) + 80} ${timestamp}
datavault_performance_api_latency_bucket{endpoint="/api/scrapers",le="+Inf"} ${Math.floor(Math.random() * 150) + 90} ${timestamp}

# HELP datavault_performance_garbage_collection_time Garbage collection time in milliseconds
# TYPE datavault_performance_garbage_collection_time counter
datavault_performance_garbage_collection_time ${Math.floor(Math.random() * 1000) + 500} ${timestamp}

# HELP datavault_performance_thread_pool_utilization Thread pool utilization percentage
# TYPE datavault_performance_thread_pool_utilization gauge
datavault_performance_thread_pool_utilization {(Math.random() * 60 + 20).toFixed(2)} ${timestamp}

# HELP datavault_performance_websocket_connections Active WebSocket connections
# TYPE datavault_performance_websocket_connections gauge
datavault_performance_websocket_connections ${Math.floor(Math.random() * 100) + 20} ${timestamp}

# HELP datavault_performance_file_descriptors Open file descriptors
# TYPE datavault_performance_file_descriptors gauge
datavault_performance_file_descriptors ${Math.floor(Math.random() * 1000) + 500} ${timestamp}
`;

    return new NextResponse(performanceMetrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to generate performance metrics' },
      { status: 500 }
    );
  }
}

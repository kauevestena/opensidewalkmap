import folium
import pandas as pd

m = folium.Map(
    min_zoom=2,
    # crs="EPSG4326"
    max_zoom=10,
)

cities_df = pd.read_csv('cities_data.csv')

print(cities_df)

m.save('index.html')
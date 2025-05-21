<script lang="ts">
	import '../app.css';
</script>

<div class="min-h-screen bg-[#0d101b] text-gray-100">
	<header class="bg-[#080a11] shadow-md border-b border-[#15192b]">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16 items-center">
				<div class="flex items-center">
					<a href="/" class="text-xl font-bold text-gray-100">
						Oblivion UE4SS Navigator
					</a>
				</div>
				<nav class="flex space-x-4">
					<a href="/" class="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-[#15192b] transition-colors">
						Home
					</a>
					<a href="/search" class="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-[#15192b] transition-colors">
						Search
					</a>
					<a href="/browse" class="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-[#15192b] transition-colors">
						Browse
					</a>
				</nav>
			</div>
		</div>
	</header>
	
	<main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
		<slot />
	</main>
	
	<footer class="bg-[#080a11] border-t border-[#15192b]">
		<div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
			<p class="text-center text-gray-400 text-sm">
				Oblivion UE4SS Navigator - A tool for exploring Oblivion Remastered's object structure
			</p>
		</div>
	</footer>
</div>
